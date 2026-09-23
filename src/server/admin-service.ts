import { randomUUID } from "crypto";
import { AppError } from "@/domain/errors";
import { iso } from "@/domain/time";
import type { HelpContact, User, VersionStatus } from "@/domain/types";
import { VERSIONS } from "@/domain/content";
import { canOperate, canReadSensitive } from "./auth";
import { effectiveVersion } from "./catalog";
import { getStore } from "./store";
import { enqueueJob } from "./enqueue";
import { limit } from "./limit";

export async function adminOverview(user: User) {
  assertOps(user);
  const store = getStore();
  const [orders, jobs, events, refunds, ledger, site] = await Promise.all([
    store.listOrders(),
    store.listJobs(),
    store.listEvents(),
    store.listRefunds(),
    store.listLedger(),
    store.getSiteConfig(),
  ]);
  const versions = [];
  for (const version of VERSIONS) versions.push(await effectiveVersion(version.id));
  return {
    appName: site.appName,
    helpContacts: site.helpContacts,
    orders: orders.map((order) => ({
      id: order.id,
      productCode: order.productCode,
      amount: order.amount,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      channel: order.channel,
      createdAt: order.createdAt,
    })),
    jobs: jobs.map((job) => ({
      id: job.id,
      kind: job.kind,
      status: job.status,
      attempt: job.attempt,
      costUsd: job.costUsd,
      error: job.error ?? null,
      billablePurchaseId: job.billablePurchaseId,
    })),
    refunds,
    events: events.map((event) => ({ name: event.name, product: event.product, createdAt: event.createdAt })),
    ledger,
    versions: versions.map((version) => ({
      id: version.id,
      title: version.title,
      status: version.status,
      translationReview: version.translationReview,
      licenseRef: version.licenseRef,
      kind: version.kind,
    })),
    funCopy: site.funCopy,
  };
}

export async function updateSite(user: User, input: { appName?: string; helpContacts?: HelpContact[] }) {
  assertOps(user);
  const store = getStore();
  const site = await store.getSiteConfig();
  if (typeof input.appName === "string" && input.appName.trim()) site.appName = input.appName.trim().slice(0, 40);
  if (Array.isArray(input.helpContacts)) {
    site.helpContacts = input.helpContacts
      .filter((item) => item.name?.trim() && item.phone?.trim() && item.source?.trim())
      .map((item) => ({
        name: item.name.trim().slice(0, 120),
        phone: item.phone.trim().slice(0, 40),
        note: String(item.note ?? "").trim().slice(0, 240),
        source: item.source.trim().slice(0, 240),
      }));
  }
  await store.saveSiteConfig(site);
  await audit(user, "site_update", "siteConfig/public");
  return site;
}

export async function updateVersion(
  user: User,
  input: { versionId: string; status: VersionStatus; translationReview: "none" | "reviewed"; licenseRef: string | null },
) {
  assertOps(user);
  const version = VERSIONS.find((item) => item.id === input.versionId);
  if (!version) throw new AppError("not_found", 404);
  if (input.status === "approved") {
    if (version.kind === "youth") throw new AppError("child_flow_closed", 400);
    if (!input.licenseRef || input.translationReview !== "reviewed") throw new AppError("license_required", 400);
    if (version.kind === "stress") {
      const site = await getStore().getSiteConfig();
      if (site.helpContacts.length === 0) throw new AppError("help_contacts_required", 400);
    }
  }
  const override = {
    versionId: input.versionId,
    status: input.status,
    translationReview: input.translationReview,
    licenseRef: input.licenseRef,
  };
  await getStore().saveVersionOverride(override);
  await audit(user, "version_update", input.versionId);
  return override;
}

export async function updateFunCopy(user: User, bandId: string, title: string, summary: string) {
  assertOps(user);
  const store = getStore();
  const site = await store.getSiteConfig();
  site.funCopy[bandId] = { title: title.slice(0, 80), summary: summary.slice(0, 280) };
  await store.saveSiteConfig(site);
  await audit(user, "fun_copy", bandId);
  return site.funCopy;
}

export async function retryJob(user: User, jobId: string) {
  assertOps(user);
  const store = getStore();
  const job = await store.getJob(jobId);
  if (!job) throw new AppError("not_found", 404);
  if (job.status !== "ready") {
    if (job.attempt >= job.maxAttempts) job.attempt = job.maxAttempts - 1;
    job.status = "pending";
    job.updatedAt = iso();
    await store.saveJob(job);
    await enqueueJob(job.id);
  }
  await audit(user, "job_retry", job.id);
  return { id: job.id, status: job.status, billablePurchaseId: job.billablePurchaseId };
}

export async function readSensitive(user: User, target: string, reason: string) {
  if (!canReadSensitive(user.role)) throw new AppError("forbidden", 403);
  if (reason.trim().length < 8) throw new AppError("reason_required", 400);
  await limit(user.id, "sensitive_read", 20);
  await audit(user, "sensitive_read", target, reason.trim().slice(0, 300));
  const store = getStore();
  if (target.startsWith("session:")) {
    const session = await store.getSession(target.slice(8));
    if (!session) throw new AppError("not_found", 404);
    return { answers: session.answers, styleInput: session.styleInput ?? null };
  }
  if (target.startsWith("upload:")) {
    const upload = await store.getUpload(target.slice(7));
    if (!upload || upload.deletedAt) throw new AppError("not_found", 404);
    return { url: await store.createReadUrl(upload.path), role: upload.role };
  }
  throw new AppError("not_found", 404);
}

function assertOps(user: User) {
  if (!canOperate(user.role)) throw new AppError("forbidden", 403);
}

async function audit(user: User, action: string, target: string, reason?: string) {
  await getStore().saveAudit({
    id: randomUUID(),
    actorId: user.id,
    role: user.role,
    action,
    target,
    reason,
    createdAt: iso(),
  });
}
