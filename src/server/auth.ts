import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getAuth } from "firebase-admin/auth";
import { getAppCheck } from "firebase-admin/app-check";
import { AppError } from "@/domain/errors";
import type { User, UserRole } from "@/domain/types";
import { iso } from "@/domain/time";
import { adminApp } from "./firebase-admin";
import { getStore } from "./store";
import { sendEmail } from "./email";

export function roleForEmail(email: string | null): UserRole {
  if (!email) return "user";
  const value = email.toLowerCase();
  const ops = (process.env.BOOTSTRAP_ADMIN_EMAIL || "").toLowerCase();
  const sensitive = (process.env.BOOTSTRAP_SENSITIVE_EMAIL || "").toLowerCase();
  const isOps = Boolean(ops) && value === ops;
  const isSensitive = Boolean(sensitive) && value === sensitive;
  if (isOps && isSensitive) return "ops_sensitive";
  if (isOps) return "ops";
  if (isSensitive) return "sensitive";
  return "user";
}

export function blankUser(id: string = randomUUID()): User {
  return {
    id,
    email: null,
    dateOfBirth: null,
    ageBand: "unknown",
    anonymous: true,
    role: "user",
    createdAt: iso(),
  };
}

export async function ensureGuest() {
  const jar = await cookies();
  const existingId = jar.get("sa_uid")?.value;
  const store = getStore();
  if (existingId) {
    const existing = await store.getUser(existingId);
    if (existing) return existing;
  }
  const user = blankUser();
  await store.saveUser(user);
  jar.set("sa_uid", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return user;
}

export async function currentUser(req: Request) {
  const store = getStore();
  const header = req.headers.get("authorization");
  const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7) : null;
  const app = adminApp();
  if (token && app) {
    const decoded = await getAuth(app).verifyIdToken(token);
    return syncUser(decoded.uid, decoded.email ?? null, Boolean(decoded.firebase?.sign_in_provider === "anonymous" || !decoded.email));
  }
  const jar = await cookies();
  const uid = jar.get("sa_uid")?.value;
  if (!uid) throw new AppError("unauthorized", 401);
  const user = await store.getUser(uid);
  if (!user) throw new AppError("unauthorized", 401);
  return user;
}

export async function optionalUser() {
  const jar = await cookies();
  const uid = jar.get("sa_uid")?.value;
  if (!uid) return null;
  return getStore().getUser(uid);
}

async function syncUser(id: string, email: string | null, anonymous: boolean) {
  const store = getStore();
  const existing = (await store.getUser(id)) ?? blankUser(id);
  existing.email = email ? email.toLowerCase() : existing.email;
  existing.anonymous = anonymous && !existing.email;
  existing.role = roleForEmail(existing.email);
  await store.saveUser(existing);
  if (existing.email) await claimOwned(existing.id);
  return existing;
}

export async function attachEmail(userId: string, email: string) {
  const store = getStore();
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new AppError("invalid_email", 400);
  const user = await store.getUser(userId);
  if (!user) throw new AppError("unauthorized", 401);
  const other = await store.findUserByEmail(normalized);
  if (other && other.id !== user.id) {
    await moveOwnership(user.id, other.id);
    return other;
  }
  user.email = normalized;
  user.anonymous = false;
  user.role = roleForEmail(normalized);
  await store.saveUser(user);
  await claimOwned(user.id);
  return user;
}

export async function requestEmailLink(userId: string, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new AppError("invalid_email", 400);
  const app = adminApp();
  const store = getStore();
  await store.savePendingClaim(normalized, userId);
  if (!app) {
    if (process.env.NODE_ENV === "production") throw new AppError("auth_unconfigured", 500);
    const user = await attachEmail(userId, normalized);
    return { sent: false, development: true, userId: user.id };
  }
  const link = await getAuth(app).generateSignInWithEmailLink(normalized, {
    url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login/finish`,
    handleCodeInApp: true,
  });
  const site = await store.getSiteConfig();
  await sendEmail({
    to: normalized,
    subject: `${site.appName}: нэвтрэх холбоос`,
    text: `Нэвтрэхийн тулд холбоосыг нээнэ үү:\n${link}\nХолбоосыг бусдад бүү дамжуул.`,
  });
  return { sent: true, development: false, userId };
}

export async function moveOwnership(fromUid: string, toUid: string) {
  if (fromUid === toUid) {
    await claimOwned(toUid);
    return;
  }
  const store = getStore();
  for (const session of await store.listSessionsByOwner(fromUid)) {
    session.ownerUid = toUid;
    session.anonymousOwner = false;
    await store.saveSession(session);
  }
  for (const report of await store.listReportsByOwner(fromUid)) {
    report.ownerUid = toUid;
    await store.saveReport(report);
  }
  for (const order of await store.listOrdersByOwner(fromUid)) {
    order.ownerUid = toUid;
    await store.saveOrder(order);
  }
  for (const upload of await store.listUploadsByOwner(fromUid)) {
    upload.ownerUid = toUid;
    await store.saveUpload(upload);
  }
  for (const job of await store.listJobs()) {
    if (job.ownerUid !== fromUid) continue;
    job.ownerUid = toUid;
    await store.saveJob(job);
  }
  for (const entitlement of await store.listEntitlementsByOwner(fromUid)) {
    entitlement.ownerUid = toUid;
    await store.saveEntitlement(entitlement);
  }
}

async function claimOwned(uid: string) {
  const store = getStore();
  for (const session of await store.listSessionsByOwner(uid)) {
    if (!session.anonymousOwner) continue;
    session.anonymousOwner = false;
    await store.saveSession(session);
  }
}

export async function assertAppCheck(req: Request) {
  if (process.env.APP_CHECK_ENFORCED !== "true") return;
  const token = req.headers.get("x-firebase-appcheck");
  const app = adminApp();
  if (!token || !app) throw new AppError("app_check", 401);
  await getAppCheck(app).verifyToken(token);
}

export function canOperate(role: UserRole) {
  return role === "ops" || role === "ops_sensitive";
}

export function canReadSensitive(role: UserRole) {
  return role === "sensitive" || role === "ops_sensitive";
}
