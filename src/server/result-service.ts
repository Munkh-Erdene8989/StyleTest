import { AppError } from "@/domain/errors";
import { projectResult } from "@/domain/paywall";
import { recordOnce } from "./events";
import { effectiveVersion } from "./catalog";
import { getStore } from "./store";
import { enqueueJob } from "./enqueue";
import { ownedSession } from "./session-service";
import type { User } from "@/domain/types";

export async function sessionResult(user: User, sessionId: string) {
  const session = await ownedSession(user, sessionId);
  const store = getStore();
  const report = await store.getReport(`rep_${session.id}`);
  if (!report || report.ownerUid !== user.id) throw new AppError("not_found", 404);
  return present(user, report.id);
}

export async function present(user: User, reportId: string) {
  const store = getStore();
  const report = await store.getReport(reportId);
  if (!report || report.ownerUid !== user.id) throw new AppError("not_found", 404);
  const versionStatus = report.versionId === "style-catalog-v1" ? "demo" : (await effectiveVersion(report.versionId)).status;
  const job = report.generationJobId ? await store.getJob(report.generationJobId) : null;
  if (job && shouldResume(job)) await enqueueJob(job.id);
  const entitlement = (await store.listEntitlementsByOwner(user.id)).find((item) => item.targetId === report.id) ?? null;
  const site = await store.getSiteConfig();
  const reveal = report.priceMnt === 0 || entitlement?.status === "active";
  const assets = reveal ? await Promise.all(report.assetPaths.map(async (path) => ({ url: await store.createReadUrl(path) }))) : [];
  const view = projectResult({
    report,
    entitlement,
    jobStatus: job?.status ?? null,
    versionStatus,
    helpContacts: report.kind === "stress" ? site.helpContacts : [],
    assets,
  });
  await recordOnce(`summary_viewed:${report.sessionId}`, {
    name: "summary_viewed",
    userId: user.id,
    product: String(report.kind),
    sessionId: report.sessionId,
  });
  if (view.entitlementStatus === "active") {
    await recordOnce(`report_opened:${report.id}`, {
      name: "report_opened",
      userId: user.id,
      product: String(report.kind),
      sessionId: report.sessionId,
    });
  }
  return view;
}

function shouldResume(job: { status: string; attempt: number; maxAttempts: number; updatedAt: string }) {
  if (job.status === "ready" || job.status === "expired") return false;
  if (job.status === "failed" && job.attempt >= job.maxAttempts) return false;
  if (job.status === "processing") return Date.now() - new Date(job.updatedAt).getTime() >= 2 * 60 * 1000;
  return true;
}

export async function markRecommendationUsed(user: User, reportId: string) {
  const store = getStore();
  const report = await store.getReport(reportId);
  if (!report || report.ownerUid !== user.id) throw new AppError("not_found", 404);
  if (report.priceMnt > 0) {
    const entitlement = (await store.listEntitlementsByOwner(user.id)).find((item) => item.targetId === report.id);
    if (entitlement?.status !== "active") throw new AppError("locked", 403);
  }
  await recordOnce(`recommendation_used:${report.id}`, {
    name: "recommendation_used",
    userId: user.id,
    product: String(report.kind),
    sessionId: report.sessionId,
  });
  return { ok: true };
}
