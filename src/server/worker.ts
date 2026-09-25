import { STYLE_DIRECTIONS } from "@/domain/content";
import { extensionFor } from "@/domain/images";
import { usdToMnt } from "@/domain/money";
import { questionAnswerPairs, bandFor } from "@/domain/score";
import { DAY_MS, iso, plus } from "@/domain/time";
import type { GenerationJob, LedgerEntry } from "@/domain/types";
import { providers } from "./ai";
import { effectiveVersion } from "./catalog";
import { sendEmail } from "./email";
import { enqueueJob } from "./enqueue";
import { getStore } from "./store";

export async function processJobById(jobId: string) {
  const store = getStore();
  const job = await store.getJob(jobId);
  if (!job || job.status === "ready" || job.status === "expired" || job.status === "processing") return;
  if (job.attempt >= job.maxAttempts) {
    job.status = "failed";
    job.updatedAt = iso();
    await store.saveJob(job);
    return;
  }
  job.attempt += 1;
  job.status = "processing";
  job.updatedAt = iso();
  job.error = undefined;
  await store.saveJob(job);
  try {
    const cost = await runJob(job);
    job.attemptCosts.push(cost);
    job.costUsd = roundUsd(job.attemptCosts.reduce((sum, item) => sum + item, 0));
    job.status = "ready";
    job.updatedAt = iso();
    await store.saveJob(job);
    await publishReady(job);
  } catch (error) {
    job.error = error instanceof Error ? error.message.slice(0, 80) : "failed";
    job.status = job.attempt >= job.maxAttempts ? "failed" : "pending";
    job.updatedAt = iso();
    await store.saveJob(job);
    if (job.status === "pending") await enqueueJob(job.id);
  }
}

async function runJob(job: GenerationJob) {
  if (job.kind === "personality_report") return runPersonality(job);
  if (job.kind === "style_package") return runStylePackage(job);
  return runStyleAddon(job);
}

async function runPersonality(job: GenerationJob) {
  const store = getStore();
  const session = await store.getSession(job.sessionId);
  const version = await effectiveVersion(session?.versionId ?? "");
  const score = await store.getScore(job.sessionId);
  if (!session || !score) throw new Error("session_missing");
  const band = bandFor(version, score.bandId);
  const explained = await providers.explainPersonality({
    band,
    outline: band.paidOutline,
    answers: questionAnswerPairs(version, session.answers),
  });
  job.provider = explained.draft.source === "model" ? "openai" : "template";
  job.model = explained.model;
  const report = await requireReport(job);
  report.fullContent = explained.draft;
  await store.saveReport(report);
  return explained.costUsd;
}

async function runStylePackage(job: GenerationJob) {
  const store = getStore();
  const session = await store.getSession(job.sessionId);
  const ids = session?.styleInput?.selectedDirectionIds ?? [];
  const directions = ids.map((id) => STYLE_DIRECTIONS.find((item) => item.id === id)).filter((item) => item !== undefined);
  if (!session?.styleInput || directions.length !== 3) throw new Error("style_missing");
  let personalitySummary: string | undefined;
  if (session.styleInput.usePersonality && session.styleInput.personalitySessionId) {
    const personality = await store.getReport(`rep_${session.styleInput.personalitySessionId}`);
    if (personality && personality.ownerUid === session.ownerUid) personalitySummary = personality.summary.title;
  }
  const explained = await providers.explainStyle({
    directions,
    comfort: session.styleInput.comfort,
    lifestyle: session.styleInput.lifestyle,
    request: session.styleInput.request,
    personalitySummary,
  });
  const face = await uploadBytes(session.styleInput.faceUploadId);
  const body = await uploadBytes(session.styleInput.bodyUploadId);
  const paths: string[] = [];
  let imageCost = 0;
  let provider = explained.draft.source === "model" ? "openai" : "template";
  for (const direction of directions) {
    const image = await providers.renderImage({ direction, face, body });
    if (image.provider !== "demo") provider = image.provider;
    const path = `private/${job.ownerUid}/reports/${job.sessionId}/${direction.id}.${extensionFor(image.contentType)}`;
    await store.putObject(path, image.bytes, image.contentType);
    paths.push(path);
    imageCost += image.costUsd;
  }
  job.provider = provider;
  job.model = explained.model;
  const report = await requireReport(job);
  report.fullContent = explained.draft;
  report.assetPaths = paths;
  await store.saveReport(report);
  await store.saveStylePackage({
    sessionId: session.id,
    directionIds: ids,
    recommendations: explained.draft,
    starterOutfits: explained.draft.starter,
    imagePaths: paths,
    deliveredDirectionIds: ids,
  });
  return roundUsd(explained.costUsd + imageCost);
}

async function runStyleAddon(job: GenerationJob) {
  const store = getStore();
  const session = await store.getSession(job.sessionId);
  const direction = STYLE_DIRECTIONS.find((item) => item.id === job.addonDirectionId);
  const pkg = await store.getStylePackage(job.sessionId);
  if (!session?.styleInput || !direction || !pkg) throw new Error("addon_missing");
  const explained = await providers.explainStyle({
    directions: [direction],
    comfort: session.styleInput.comfort,
    lifestyle: session.styleInput.lifestyle,
    request: session.styleInput.request,
  });
  const face = await uploadBytes(session.styleInput.faceUploadId);
  const body = await uploadBytes(session.styleInput.bodyUploadId);
  const image = await providers.renderImage({ direction, face, body });
  const path = `private/${job.ownerUid}/reports/${job.id}/${direction.id}.${extensionFor(image.contentType)}`;
  await store.putObject(path, image.bytes, image.contentType);
  const report = await requireReport(job);
  report.fullContent = { ...explained.draft, demoImage: image.provider === "demo" };
  report.assetPaths = [path];
  await store.saveReport(report);
  pkg.deliveredDirectionIds = [...new Set([...pkg.deliveredDirectionIds, direction.id])];
  pkg.imagePaths = [...pkg.imagePaths, path];
  await store.saveStylePackage(pkg);
  job.provider = image.provider;
  return roundUsd(explained.costUsd + image.costUsd);
}

async function publishReady(job: GenerationJob) {
  const store = getStore();
  const report = await requireReport(job);
  const paid = (await store.listOrders()).find(
    (order) =>
      order.sessionId === job.sessionId &&
      order.productCode === job.kind &&
      (order.addonDirectionId ?? "") === (job.addonDirectionId ?? "") &&
      order.paymentStatus === "paid",
  );
  if (paid) {
    report.expiresAt = undefined;
  } else if (report.priceMnt > 0) {
    report.expiresAt = plus(7 * DAY_MS);
  }
  await store.saveReport(report);
  await writeCost(job, Boolean(paid));
  if (!paid) return;
  const entitlement = await store.getEntitlement(`ent_${paid.id}`);
  if (!entitlement || entitlement.status === "revoked" || entitlement.status === "active") return;
  entitlement.status = "active";
  entitlement.grantedAt = iso();
  await store.saveEntitlement(entitlement);
  await deliverReportEmail(paid.ownerUid, paid.id, report.id);
}

async function writeCost(job: GenerationJob, paid: boolean) {
  const store = getStore();
  const first = job.attemptCosts[0] ?? 0;
  const retry = job.attemptCosts.slice(1).reduce((sum, item) => sum + item, 0);
  const entry: LedgerEntry = {
    id: `cost:${job.id}`,
    type: paid ? "paid_cogs" : "unpaid_sunk",
    jobId: job.id,
    costUsd: roundUsd(first),
    costMnt: usdToMnt(first),
    ownerRef: job.ownerUid,
    createdAt: iso(),
  };
  await store.saveLedger(entry);
  if (retry > 0) {
    await store.saveLedger({
      id: `retry:${job.id}`,
      type: "retry_cogs",
      jobId: job.id,
      costUsd: roundUsd(retry),
      costMnt: usdToMnt(retry),
      ownerRef: job.ownerUid,
      createdAt: iso(),
    });
  }
}

export async function deliverReportEmail(userId: string, orderId: string, reportId: string) {
  const store = getStore();
  const key = `report:${orderId}`;
  if (await store.getEmail(key)) return;
  const user = await store.getUser(userId);
  const site = await store.getSiteConfig();
  if (!user?.email) return;
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reports/${reportId}`;
  const result = await sendEmail({
    to: user.email,
    subject: `${site.appName}: тайлан бэлэн боллоо`,
    text: `Тайлангаа нэвтэрч үзнэ үү:\n${url}\nЭнэ имэйлд тайлангийн бүтэн агуулга байхгүй.`,
  });
  await store.saveEmail({ key, to: user.email, status: result.skipped ? "skipped" : "sent", createdAt: iso() });
}

export async function recoverCost(jobId: string) {
  const store = getStore();
  const entry = await store.getLedger(`cost:${jobId}`);
  if (!entry || entry.type !== "unpaid_sunk") return;
  entry.type = "paid_cogs";
  await store.saveLedger(entry);
}

async function requireReport(job: GenerationJob) {
  const store = getStore();
  const reportId = job.kind === "style_addon" ? `rep_${job.id}` : `rep_${job.sessionId}`;
  const report = await store.getReport(reportId);
  if (!report) throw new Error("report_missing");
  return report;
}

async function uploadBytes(uploadId?: string) {
  if (!uploadId) return undefined;
  const upload = await getStore().getUpload(uploadId);
  if (!upload || upload.deletedAt) return undefined;
  const object = await getStore().getObject(upload.path);
  return object?.bytes;
}

function roundUsd(value: number) {
  return Math.round(value * 10_000) / 10_000;
}
