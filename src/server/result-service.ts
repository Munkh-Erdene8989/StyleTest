import { AppError } from "@/domain/errors";
import { projectResult } from "@/domain/paywall";
import { answerCounts, reportCounts, type TrackProgress } from "@/domain/progress";
import { recordOnce } from "./events";
import { effectiveVersion, loadCatalog } from "./catalog";
import { getStore } from "./store";
import { enqueueJob } from "./enqueue";
import { ownedSession } from "./session-service";
import type { Report, Session, User } from "@/domain/types";

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
  const session = await store.getSession(report.sessionId);
  const progress = await trackProgress(session, report, job?.status ?? null);
  const view = {
    ...projectResult({
      report,
      entitlement,
      jobStatus: job?.status ?? null,
      versionStatus,
      helpContacts: report.kind === "stress" ? site.helpContacts : [],
      assets,
    }),
    progress,
  };
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

export type AccountTrack = {
  id: string;
  title: string;
  href: string;
  action: string;
  kind: string;
  progress: TrackProgress;
};

export async function listAccountTracks(user: User): Promise<AccountTrack[]> {
  const store = getStore();
  const [sessions, reports, catalog] = await Promise.all([
    store.listSessionsByOwner(user.id),
    store.listReportsByOwner(user.id),
    loadCatalog(),
  ]);
  const reportBySession = new Map(reports.map((report) => [report.sessionId, report]));
  const seen = new Set<string>();
  const tracks: AccountTrack[] = [];
  const ordered = [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const session of ordered) {
    const report = reportBySession.get(session.id);
    seen.add(session.id);
    const jobStatus = report?.generationJobId ? (await store.getJob(report.generationJobId))?.status ?? null : null;
    const row = catalog.find((item) => item.test.id === session.testId || item.version.id === session.versionId);
    const open = session.status === "in_progress";
    tracks.push({
      id: session.id,
      title: report?.summary.title ?? row?.version.title ?? (session.kind === "style" ? "Стайлын зөвлөмж" : "Тест"),
      href: open ? resumeHref(session, row?.test.slug) : report ? `/reports/${report.id}` : `/sessions/${session.id}`,
      action: open ? "Үргэлжлүүлэх" : "Тайлан харах",
      kind: session.kind,
      progress: await trackProgress(session, report ?? null, jobStatus),
    });
  }
  for (const report of reports) {
    if (seen.has(report.sessionId)) continue;
    const jobStatus = report.generationJobId ? (await store.getJob(report.generationJobId))?.status ?? null : null;
    tracks.push({
      id: report.id,
      title: report.summary.title,
      href: `/reports/${report.id}`,
      action: "Тайлан харах",
      kind: report.kind,
      progress: await trackProgress(null, report, jobStatus),
    });
  }
  return tracks;
}

async function trackProgress(session: Session | null, report: Report | null, jobStatus: string | null): Promise<TrackProgress> {
  const questions = session && session.kind !== "style" ? await questionTotal(session.versionId) : 1;
  const answers = session ? answerCounts(session, questions) : { answered: 0, questions: 1 };
  const ready = Boolean(report?.fullContent) && (jobStatus === null || jobStatus === "ready");
  return { ...answers, ...reportCounts({ jobStatus, ready }) };
}

async function questionTotal(versionId: string) {
  try {
    const version = await effectiveVersion(versionId);
    return version.questions.length;
  } catch {
    return 1;
  }
}

function resumeHref(session: Session, slug: string | undefined) {
  if (session.kind === "style") return "/style";
  if (slug) return `/tests/${slug}/quiz`;
  return `/tests`;
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
