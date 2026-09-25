import { createHash, randomUUID } from "crypto";
import { canStartTest } from "@/domain/age";
import { STYLE_DIRECTIONS, STYLE_EXAMPLES } from "@/domain/content";
import { AppError } from "@/domain/errors";
import { imageFormatOk } from "@/domain/images";
import { stableId } from "@/domain/jobs";
import { PRICES } from "@/domain/money";
import { bandFor, scoreAnswers } from "@/domain/score";
import { rankDirections } from "@/domain/style-match";
import { DAY_MS, iso, plus } from "@/domain/time";
import type { GenerationJob, Report, Session, StyleInput, Upload, User } from "@/domain/types";
import { effectiveVersion, loadCatalog, testBySlug } from "./catalog";
import { enqueueJob } from "./enqueue";
import { recordOnce } from "./events";
import { limit } from "./limit";
import { getStore } from "./store";

export async function createQuizSession(user: User, slug: string) {
  const row = await testBySlug(slug);
  if (!row) throw new AppError("not_found", 404);
  const { test, version } = row;
  if (!canStartTest(version.kind, user.ageBand)) throw new AppError("age_restricted", 403);
  await limit(user.id, "session_create", 40);
  const now = iso();
  const session: Session = {
    id: randomUUID(),
    ownerUid: user.id,
    kind: version.kind,
    testId: test.id,
    versionId: version.id,
    answers: {},
    status: "in_progress",
    anonymousOwner: user.anonymous,
    createdAt: now,
    updatedAt: now,
    expiresAt: plus(14 * DAY_MS),
  };
  await getStore().saveSession(session);
  await recordOnce(`test_started:${session.id}`, {
    name: "test_started",
    userId: user.id,
    product: version.kind,
    sessionId: session.id,
  });
  return session;
}

export async function saveQuizAnswers(user: User, sessionId: string, answers: Record<string, string>) {
  const session = await ownedSession(user, sessionId);
  if (session.status !== "in_progress" || session.kind === "style") throw new AppError("closed", 400);
  const version = await effectiveVersion(session.versionId);
  for (const [questionId, optionId] of Object.entries(answers)) {
    const question = version.questions.find((item) => item.id === questionId);
    if (!question || !question.options.some((option) => option.id === optionId)) throw new AppError("invalid_answer", 400);
  }
  session.answers = { ...session.answers, ...answers };
  session.updatedAt = iso();
  await getStore().saveSession(session);
  return session;
}

export async function completeQuiz(user: User, sessionId: string) {
  const session = await ownedSession(user, sessionId);
  if (session.kind === "style") throw new AppError("invalid_session", 400);
  if (session.status === "completed") return session;
  await limit(user.id, "session_complete", 20);
  const version = await effectiveVersion(session.versionId);
  const score = scoreAnswers(version, session.answers);
  score.sessionId = session.id;
  const band = bandFor(version, score.bandId);
  const site = await getStore().getSiteConfig();
  const override = version.kind === "fun" ? site.funCopy[band.id] : undefined;
  const catalog = await loadCatalog();
  const priced = catalog.find((item) => item.version.id === version.id);
  const priceMnt = version.kind === "personality" ? (priced?.test.priceMnt ?? PRICES.personality_report) : 0;
  session.status = "completed";
  session.updatedAt = iso();
  const report: Report = {
    id: `rep_${session.id}`,
    sessionId: session.id,
    ownerUid: user.id,
    versionId: version.id,
    kind: version.kind,
    summary: {
      title: override?.title ?? band.title,
      body: override?.summary ?? band.summary,
      disclaimer: version.disclaimer,
    },
    outline: version.kind === "personality" ? band.paidOutline : [],
    fullContent:
      version.kind === "personality"
        ? null
        : { source: "template", paragraphs: band.detail, score: score.raw },
    assetPaths: [],
    priceMnt,
    createdAt: iso(),
  };
  const store = getStore();
  await store.saveScore(score);
  await store.saveSession(session);
  await store.saveReport(report);
  if (version.kind === "personality") {
    const job = newJob({
      session,
      kind: "personality_report",
      inputHash: hashOf(session.answers),
      billablePurchaseId: null,
    });
    const existing = await store.getJob(job.id);
    if (!existing) {
      report.generationJobId = job.id;
      await store.saveReport(report);
      await store.saveJob(job);
      await enqueueJob(job.id);
    }
  }
  await recordOnce(`test_completed:${session.id}`, {
    name: "test_completed",
    userId: user.id,
    product: version.kind,
    sessionId: session.id,
  });
  return session;
}

export async function createStyleSession(user: User) {
  if (!canStartTest("style", user.ageBand)) throw new AppError("age_restricted", 403);
  await limit(user.id, "session_create", 40);
  const now = iso();
  const session: Session = {
    id: randomUUID(),
    ownerUid: user.id,
    kind: "style",
    testId: "style",
    versionId: "style-catalog-v1",
    answers: {},
    styleInput: emptyStyle(),
    status: "in_progress",
    anonymousOwner: user.anonymous,
    createdAt: now,
    updatedAt: now,
    expiresAt: plus(14 * DAY_MS),
  };
  await getStore().saveSession(session);
  await recordOnce(`test_started:${session.id}`, {
    name: "test_started",
    userId: user.id,
    product: "style",
    sessionId: session.id,
  });
  return session;
}

export async function saveStyleInput(user: User, sessionId: string, patch: Partial<StyleInput>) {
  const session = await ownedSession(user, sessionId);
  if (session.kind !== "style" || session.status !== "in_progress" || !session.styleInput) {
    throw new AppError("closed", 400);
  }
  const next = { ...session.styleInput, ...patch };
  assertIds(next.likedIds);
  assertIds(next.aspireIds);
  assertIds(next.dislikedIds);
  if (next.lifestyle !== "office" && next.lifestyle !== "home" && next.lifestyle !== "mixed") {
    throw new AppError("invalid_answer", 400);
  }
  next.comfort = clip(next.comfort);
  next.request = clip(next.request);
  session.styleInput = next;
  session.updatedAt = iso();
  await getStore().saveSession(session);
  return session;
}

export async function saveStyleUpload(
  user: User,
  sessionId: string,
  role: "face" | "body",
  bytes: Buffer,
  contentType: string,
  consent: boolean,
) {
  if (!consent) throw new AppError("consent_required", 400);
  if (!["image/png", "image/jpeg", "image/webp"].includes(contentType) || !imageFormatOk(bytes, contentType)) {
    throw new AppError("invalid_image", 400);
  }
  if (bytes.length > 8 * 1024 * 1024) throw new AppError("file_too_large", 400);
  await limit(user.id, "upload", 20);
  const session = await ownedSession(user, sessionId);
  if (session.kind !== "style" || !session.styleInput) throw new AppError("invalid_session", 400);
  const store = getStore();
  const upload: Upload = {
    id: randomUUID(),
    ownerUid: user.id,
    sessionId,
    role,
    path: `private/${user.id}/uploads/${randomUUID()}`,
    contentType,
    consentAt: iso(),
    linked: false,
    createdAt: iso(),
  };
  await store.putObject(upload.path, bytes, contentType);
  await store.saveUpload(upload);
  if (role === "face") session.styleInput.faceUploadId = upload.id;
  if (role === "body") session.styleInput.bodyUploadId = upload.id;
  session.styleInput.consentAt = upload.consentAt;
  session.updatedAt = iso();
  await store.saveSession(session);
  return upload;
}

export async function completeStyle(user: User, sessionId: string) {
  const session = await ownedSession(user, sessionId);
  if (session.kind !== "style" || !session.styleInput) throw new AppError("invalid_session", 400);
  if (session.status === "completed") return session;
  const input = session.styleInput;
  if (!input.consentAt || !input.faceUploadId || !input.bodyUploadId) throw new AppError("consent_required", 400);
  if (input.likedIds.length + input.aspireIds.length === 0) throw new AppError("preference_required", 400);
  const selected = rankDirections({
    directions: STYLE_DIRECTIONS,
    examples: STYLE_EXAMPLES,
    likedIds: input.likedIds,
    aspireIds: input.aspireIds,
    dislikedIds: input.dislikedIds,
    lifestyle: input.lifestyle,
    delivered: [],
    limit: 3,
  });
  if (selected.length < 3) throw new AppError("not_enough_directions", 400);
  await limit(user.id, "session_complete", 20);
  input.selectedDirectionIds = selected.map((item) => item.id);
  session.styleInput = input;
  session.status = "completed";
  session.updatedAt = iso();
  const store = getStore();
  for (const uploadId of [input.faceUploadId, input.bodyUploadId]) {
    const upload = await store.getUpload(uploadId);
    if (!upload || upload.ownerUid !== user.id) throw new AppError("invalid_image", 400);
    upload.linked = true;
    await store.saveUpload(upload);
  }
  const report: Report = {
    id: `rep_${session.id}`,
    sessionId: session.id,
    ownerUid: user.id,
    versionId: "style-catalog-v1",
    kind: "style_package",
    summary: {
      title: "Стайлын товч чиглэл",
      body: selected.map((item) => item.title).join(", "),
      disclaimer: "Товч чиглэл үнэгүй. Бүтэн багц, AI дүрслэл төлбөртэй. Нүүр хадгалалтыг баталгаажуулахгүй.",
    },
    outline: [
      "Санал болгосон 3 стайлийн чиглэл",
      "Эсгүүр, өнгө, аксессуар, хослол",
      "3 AI дүрслэл",
      "Эхлэх 5 хувцас",
    ],
    fullContent: null,
    assetPaths: [],
    priceMnt: PRICES.style_package,
    createdAt: iso(),
  };
  const job = newJob({
    session,
    kind: "style_package",
    inputHash: hashOf(input.selectedDirectionIds),
    billablePurchaseId: null,
  });
  report.generationJobId = job.id;
  await store.saveSession(session);
  await store.saveReport(report);
  if (!(await store.getJob(job.id))) {
    await store.saveJob(job);
    await enqueueJob(job.id);
  }
  await recordOnce(`test_completed:${session.id}`, {
    name: "test_completed",
    userId: user.id,
    product: "style",
    sessionId: session.id,
  });
  return session;
}

export async function ownedSession(user: User, sessionId: string) {
  const session = await getStore().getSession(sessionId);
  if (!session || session.ownerUid !== user.id) throw new AppError("not_found", 404);
  return session;
}

export function newJob(input: {
  session: Session;
  kind: GenerationJob["kind"];
  inputHash: string;
  addonDirectionId?: string;
  billablePurchaseId: string | null;
}): GenerationJob {
  const now = iso();
  return {
    id: stableId([input.session.id, input.kind, input.session.versionId, input.inputHash, input.addonDirectionId ?? ""]),
    sessionId: input.session.id,
    ownerUid: input.session.ownerUid,
    kind: input.kind,
    addonDirectionId: input.addonDirectionId,
    status: "pending",
    attempt: 0,
    maxAttempts: 2,
    costUsd: 0,
    attemptCosts: [],
    billablePurchaseId: input.billablePurchaseId,
    inputHash: input.inputHash,
    createdAt: now,
    updatedAt: now,
  };
}

export async function resumeSession(user: User, slug: string) {
  const row = await testBySlug(slug);
  if (!row) return null;
  const test = row.test;
  const sessions = await getStore().listSessionsByOwner(user.id);
  return sessions.find((session) => session.testId === test.id && session.status === "in_progress") ?? null;
}

function emptyStyle(): StyleInput {
  return {
    likedIds: [],
    aspireIds: [],
    dislikedIds: [],
    lifestyle: "mixed",
    comfort: "",
    request: "",
    usePersonality: false,
  };
}

function assertIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.length > 6) throw new AppError("invalid_answer", 400);
  for (const id of ids) {
    if (!STYLE_EXAMPLES.some((item) => item.id === id)) throw new AppError("invalid_answer", 400);
  }
}

function clip(value: string) {
  return String(value ?? "").slice(0, 400);
}

function hashOf(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}
