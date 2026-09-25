import { randomUUID } from "crypto";
import { catalogFromLibrary, sanitizeDraft, sanitizeNews, scoreSpan, bandIssues } from "@/domain/admin-content";
import { AppError } from "@/domain/errors";
import { iso } from "@/domain/time";
import type { HelpContact, User, VersionStatus } from "@/domain/types";
import { VERSIONS } from "@/domain/content";
import { NEWS_POSTS } from "@/domain/news";
import { canOperate, canReadSensitive } from "./auth";
import { effectiveVersion, loadCatalog } from "./catalog";
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

export async function adminDesk(user: User) {
  assertOps(user);
  const store = getStore();
  const [orders, jobs, events, refunds, ledger, site, users, sessions, scores, reports, auditLogs, catalog, library] = await Promise.all([
    store.listOrders(),
    store.listJobs(),
    store.listEvents(),
    store.listRefunds(),
    store.listLedger(),
    store.getSiteConfig(),
    store.listUsers(),
    store.listSessions(),
    store.listScores(),
    store.listReports(),
    store.listAudit(),
    loadCatalog(),
    store.getAdminLibrary(),
  ]);
  const scoreBySession = new Map(scores.map((score) => [score.sessionId, score]));
  const tests = catalog.map((row) => {
    const span = scoreSpan(row.version.questions);
    return { ...row, span, issues: bandIssues(row.version.bands, span) };
  });
  return {
    viewer: {
      id: user.id,
      email: user.email,
      role: user.role,
      canReadSensitive: canReadSensitive(user.role),
    },
    appName: site.appName,
    helpContacts: site.helpContacts,
    funCopy: site.funCopy,
    tests,
    news: library.news ?? NEWS_POSTS,
    users: users
      .map((item) => ({
        id: item.id,
        email: item.email,
        ageBand: item.ageBand,
        anonymous: item.anonymous,
        role: item.role,
        createdAt: item.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    sessions: sessions
      .map((session) => {
        const score = scoreBySession.get(session.id);
        return {
          id: session.id,
          ownerUid: session.ownerUid,
          kind: session.kind,
          testId: session.testId,
          versionId: session.versionId,
          status: session.status,
          answerCount: Object.keys(session.answers).length,
          styleReady: Boolean(session.styleInput),
          createdAt: session.createdAt,
          score: score ? { raw: score.raw, bandId: score.bandId } : null,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    reports: reports
      .map((report) => ({
        id: report.id,
        sessionId: report.sessionId,
        ownerUid: report.ownerUid,
        versionId: report.versionId,
        kind: report.kind,
        title: report.summary.title,
        body: report.summary.body,
        disclaimer: report.summary.disclaimer ?? "",
        outline: report.outline,
        fullContent: report.fullContent,
        priceMnt: report.priceMnt,
        generationJobId: report.generationJobId ?? null,
        createdAt: report.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    orders: orders
      .map((order) => ({
        id: order.id,
        ownerUid: order.ownerUid,
        productCode: order.productCode,
        amount: order.amount,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        channel: order.channel,
        sessionId: order.sessionId,
        reportId: order.reportId,
        paidAt: order.paidAt ?? null,
        createdAt: order.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    jobs: jobs
      .map((job) => ({
        id: job.id,
        sessionId: job.sessionId,
        kind: job.kind,
        status: job.status,
        attempt: job.attempt,
        maxAttempts: job.maxAttempts,
        costUsd: job.costUsd,
        error: job.error ?? null,
        model: job.model ?? null,
        createdAt: job.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    refunds: [...refunds].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    events: [...events]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 40)
      .map((event) => ({ name: event.name, product: event.product ?? null, createdAt: event.createdAt })),
    ledger: [...ledger].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40),
    audit: [...auditLogs]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 40)
      .map((log) => ({
        id: log.id,
        actorId: log.actorId,
        role: log.role,
        action: log.action,
        target: log.target,
        reason: log.reason ?? "",
        createdAt: log.createdAt,
      })),
  };
}

export async function saveTestDraft(user: User, raw: unknown) {
  assertOps(user);
  const store = getStore();
  const library = await store.getAdminLibrary();
  const catalog = catalogFromLibrary(library);
  const result = sanitizeDraft(raw, catalog);
  if ("issues" in result) throw new AppError("invalid_test", 400, result.issues);
  const draft = { ...result.draft, updatedAt: iso() };
  if (draft.version.status === "approved" && draft.version.kind === "stress") {
    const site = await store.getSiteConfig();
    if (site.helpContacts.length === 0) {
      throw new AppError("help_contacts_required", 400, ["Стрессийн тестийг баталгаажуулахаас өмнө тусламжийн холбоо оруулна."]);
    }
  }
  library.tests = [...library.tests.filter((item) => item.version.id !== draft.version.id), draft];
  await store.saveAdminLibrary(library);
  await store.saveVersionOverride({
    versionId: draft.version.id,
    status: draft.version.status,
    translationReview: draft.version.translationReview,
    licenseRef: draft.version.licenseRef,
  });
  await audit(user, "test_save", draft.version.id);
  return draft;
}

export async function removeTestDraft(user: User, versionId: string) {
  assertOps(user);
  if (VERSIONS.some((item) => item.id === versionId)) {
    throw new AppError("builtin_locked", 400, ["Системийн тестийг устгахгүй. Сайт дээр харуулахыг унтрааж болно."]);
  }
  const store = getStore();
  const library = await store.getAdminLibrary();
  library.tests = library.tests.filter((item) => item.version.id !== versionId);
  await store.saveAdminLibrary(library);
  await audit(user, "test_remove", versionId);
  return { ok: true };
}

export async function saveNewsPosts(user: User, raw: unknown) {
  assertOps(user);
  const result = sanitizeNews(raw);
  if ("issues" in result) throw new AppError("invalid_news", 400, result.issues);
  const store = getStore();
  const library = await store.getAdminLibrary();
  library.news = result.posts;
  await store.saveAdminLibrary(library);
  await audit(user, "news_save", "news");
  return result.posts;
}

