import { createHash } from "crypto";
import { getAuth } from "firebase-admin/auth";
import { accountDeletion, originalPhotoDeletion } from "@/domain/deletion";
import { AppError } from "@/domain/errors";
import { iso } from "@/domain/time";
import type { User } from "@/domain/types";
import { adminApp } from "./firebase-admin";
import { getStore } from "./store";
import { retentionPlan } from "@/domain/retention";

export async function deleteOriginalPhotos(user: User) {
  const store = getStore();
  const uploads = await store.listUploadsByOwner(user.id);
  const plan = originalPhotoDeletion(uploads);
  for (const path of plan.paths) await store.deleteObject(path);
  for (const id of plan.uploadIds) {
    const upload = await store.getUpload(id);
    if (!upload) continue;
    upload.deletedAt = iso();
    await store.saveUpload(upload);
  }
  return { deletedUploads: plan.uploadIds.length, reportsKept: true };
}

export async function deleteAccount(user: User) {
  const store = getStore();
  const plan = accountDeletion({
    userId: user.id,
    sessions: await store.listSessionsByOwner(user.id),
    reports: await store.listReportsByOwner(user.id),
    uploads: await store.listUploadsByOwner(user.id),
    entitlements: await store.listEntitlementsByOwner(user.id),
  });
  for (const path of plan.paths) await store.deleteObject(path);
  for (const id of plan.sessionIds) await store.deleteSession(id);
  for (const id of plan.reportIds) await store.deleteReport(id);
  for (const id of plan.uploadIds) {
    const upload = await store.getUpload(id);
    if (!upload) continue;
    upload.deletedAt = iso();
    upload.path = "";
    await store.saveUpload(upload);
  }
  for (const id of plan.revokeEntitlementIds) {
    const entitlement = await store.getEntitlement(id);
    if (!entitlement) continue;
    entitlement.status = "revoked";
    entitlement.revokedAt = iso();
    await store.saveEntitlement(entitlement);
  }
  const ownerRef = `deleted:${createHash("sha256").update(user.id).digest("hex").slice(0, 12)}`;
  for (const order of await store.listOrdersByOwner(user.id)) {
    order.ownerUid = ownerRef;
    await store.saveOrder(order);
  }
  for (const entry of await store.listLedger()) {
    if (entry.ownerRef !== user.id) continue;
    entry.ownerRef = ownerRef;
    await store.saveLedger(entry);
  }
  const app = adminApp();
  if (app) {
    try {
      await getAuth(app).deleteUser(user.id);
    } catch {
      console.error("auth_delete_failed");
    }
  }
  const removed = user.id;
  await store.saveUser({ ...user, email: null, dateOfBirth: null, anonymous: true, role: "user" });
  return { deletedUser: removed, financialRecordsKept: true };
}

export async function runRetention(now = new Date()) {
  const store = getStore();
  const plan = retentionPlan({
    now,
    sessions: await store.listSessions(),
    reports: await store.listReports(),
    uploads: await store.listUploads(),
    orders: await store.listOrders(),
  });
  for (const id of plan.sessionIds) await store.deleteSession(id);
  for (const id of plan.reportIds) {
    const report = await store.getReport(id);
    if (!report) continue;
    for (const path of report.assetPaths) await store.deleteObject(path);
    report.assetPaths = [];
    report.fullContent = null;
    report.expiresAt = undefined;
    report.summary = { ...report.summary, body: "Хадгалах хугацаа дууссан тул дэлгэрэнгүй хэсгийг устгасан." };
    await store.saveReport(report);
  }
  for (const id of plan.uploadIds) {
    const upload = await store.getUpload(id);
    if (!upload) continue;
    await store.deleteObject(upload.path);
    upload.deletedAt = iso(now);
    await store.saveUpload(upload);
  }
  return plan;
}
