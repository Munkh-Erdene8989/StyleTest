import { randomUUID } from "crypto";
import { after } from "next/server";
import { quizByKind } from "@/content/quizzes/catalog";
import type { AiQuizKind, AiQuizRecord } from "@/domain/ai-quiz";
import { AppError } from "@/domain/errors";
import { imageFormatOk } from "@/domain/images";
import { STYLE_QUIZ_PRICE_MNT } from "@/domain/money";
import { paymentRequired, type ObservedPayment } from "@/domain/payment";
import { iso } from "@/domain/time";
import type { Upload, User } from "@/domain/types";
import { loadArchetypeBank, normalizeAnswers } from "./ai-quiz-banks";
import { sendEmail } from "./email";
import { ensureQuizReportPdf } from "./face-report-pdf";
import { limit } from "./limit";
import { checkInvoice, createInvoice, simulatePayAllowed } from "./qpay";
import { settlePayment } from "./settlement";
import { getStore } from "./store";

const KINDS: AiQuizKind[] = ["face_beauty", "body_shape", "archetype"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function saveQuizPhoto(user: User, input: { role: string; bytes: Buffer; contentType: string; consent: boolean }) {
  if (!input.consent) throw new AppError("consent_required", 400);
  if (input.role !== "face" && input.role !== "body") throw new AppError("invalid_image", 400);
  if (!["image/png", "image/jpeg", "image/webp"].includes(input.contentType) || !imageFormatOk(input.bytes, input.contentType)) {
    throw new AppError("invalid_image", 400);
  }
  if (input.bytes.length > 8 * 1024 * 1024) throw new AppError("file_too_large", 400);
  await limit(user.id, "upload", 20);
  const upload: Upload = {
    id: randomUUID(),
    ownerUid: user.id,
    sessionId: "quiz",
    role: input.role,
    path: `private/${user.id}/quiz-photos/${randomUUID()}`,
    contentType: input.contentType,
    consentAt: iso(),
    linked: false,
    createdAt: iso(),
  };
  const store = getStore();
  await store.putObject(upload.path, input.bytes, input.contentType);
  await store.saveUpload(upload);
  return { id: upload.id, role: upload.role };
}

export async function createAiQuizCheckout(user: User, input: { kind: string; answers: unknown; email: string; photoId?: string }) {
  const email = String(input.email ?? "").replace(/\s+/g, "").trim().toLowerCase().slice(0, 160);
  if (!EMAIL.test(email)) throw new AppError("invalid_contact", 400);
  const kind = parseKind(input.kind);
  if (kind === "archetype" && !loadArchetypeBank()) throw new AppError("quiz_unavailable", 404);
  const parsed = normalizeAnswers(kind, input.answers);
  if (!parsed || parsed.missing.length) throw new AppError("answers_incomplete", 400);
  await limit(email, "ai_quiz_create", 8);
  const listing = quizByKind(kind);
  const quiz: AiQuizRecord = {
    id: `aiq_${randomUUID()}`,
    kind,
    ownerUid: user.id,
    email,
    answers: parsed.answers,
    amount: STYLE_QUIZ_PRICE_MNT,
    currency: "MNT",
    paymentStatus: "invoiced",
    urls: [],
    brief: null,
    detail: null,
    reportStatus: "pending",
    createdAt: iso(),
  };
  await attachQuizPhoto(user, quiz, input.photoId);
  if (!paymentRequired()) {
    quiz.paymentStatus = "paid";
    quiz.paidAt = iso();
    await getStore().saveAiQuiz(quiz);
    scheduleReport(quiz);
    return publicQuiz(quiz);
  }
  const invoice = await createInvoice({
    id: quiz.id,
    amount: quiz.amount,
    description: `Naruka ${listing?.title ?? "тайлан"}`,
  });
  quiz.qpayInvoiceId = invoice.invoiceId;
  quiz.qrImage = invoice.qrImage;
  quiz.urls = invoice.urls;
  await getStore().saveAiQuiz(quiz);
  return publicQuiz(quiz);
}

export async function readAiQuiz(user: User, id: string) {
  const quiz = await loadOwned(user, id);
  return publicQuiz(quiz);
}

export async function confirmAiQuiz(user: User, id: string) {
  await limit(id, "ai_quiz_check", 90, 10 * 60 * 1000);
  const quiz = await loadOwned(user, id);
  if (!quiz.qpayInvoiceId) throw new AppError("invoice_missing", 400);
  const observed = await checkInvoice(quiz.qpayInvoiceId);
  return applyAiQuizObservation(quiz.id, observed);
}

export async function simulateAiQuiz(user: User, id: string) {
  if (!simulatePayAllowed()) throw new AppError("simulate_disabled", 403);
  const quiz = await loadOwned(user, id);
  return applyAiQuizObservation(quiz.id, {
    paid: true,
    amount: quiz.amount,
    currency: "MNT",
    paymentId: `sim_${quiz.id}`,
    channel: "other",
  });
}

export async function retryAiQuiz(user: User, id: string) {
  const quiz = await loadOwned(user, id);
  if (quiz.paymentStatus !== "paid") throw new AppError("unpaid", 402);
  if (quiz.reportStatus === "sent" || quiz.reportStatus === "sending") return publicQuiz(quiz);
  await getStore().updateAiQuiz(id, (current) => ({ ...current, reportStatus: "pending" }));
  scheduleReport({ ...quiz, reportStatus: "pending" });
  return publicQuiz({ ...quiz, reportStatus: "pending" });
}

export async function fulfillAiQuiz(id: string) {
  const store = getStore();
  const current = await store.getAiQuiz(id);
  if (!current || current.paymentStatus !== "paid") return;
  if (current.reportStatus === "sent" || current.reportStatus === "sending") return;
  const { previous } = await store.updateAiQuiz(id, (quiz) => {
    if (quiz.reportStatus === "sent" || quiz.reportStatus === "sending") return quiz;
    return { ...quiz, reportStatus: "sending" };
  });
  if (previous.reportStatus === "sent" || previous.reportStatus === "sending") return;
  try {
    const photo = await quizPhoto(current);
    const report = await ensureQuizReportPdf(current, photo);
    await sendEmail({
      to: current.email,
      subject: "Naruka — таны хувийн тайлан бэлэн боллоо",
      text: [
        "Сайн байна уу.",
        "",
        "Таны хувийн тайлан бэлэн боллоо.",
        "25 хуудастай PDF хавсаргав.",
        "Зураг хангалттай бол тэр зурган дээр туршина. Хангалтгүй бол жишээ нь маникен.",
        "",
        "— Naruka Styling Studio",
      ].join("\n"),
      attachments: [{ filename: `naruka-${current.kind}-report.pdf`, content: report.pdf }],
    });
    await store.updateAiQuiz(id, (quiz) => ({ ...quiz, brief: report.brief, detail: report.detail, reportStatus: "sent" }));
  } catch (error) {
    console.error("ai_quiz_report_failed", error instanceof Error ? error.message.slice(0, 180) : "unknown");
    await store.updateAiQuiz(id, (quiz) => ({ ...quiz, reportStatus: "failed" }));
  }
}

export async function applyAiQuizObservation(id: string, observed: ObservedPayment) {
  const store = getStore();
  const current = await store.getAiQuiz(id);
  if (!current) throw new AppError("not_found", 404);
  const settled = await settlePayment(current, observed, {
    commit: (stamp) =>
      store.updateAiQuiz(id, (quiz) => {
        if (quiz.paymentStatus === "paid") return quiz;
        return {
          ...quiz,
          paymentStatus: "paid",
          qpayPaymentId: stamp.qpayPaymentId,
          paidAt: stamp.paidAt,
        };
      }),
    afterPaid: (quiz) => scheduleReport(quiz),
    afterDuplicate: (quiz) => scheduleReport(quiz),
  });
  return { duplicate: settled.duplicate, quiz: publicQuiz(settled.record), reason: settled.reason };
}

async function attachQuizPhoto(user: User, quiz: AiQuizRecord, photoId?: string) {
  if (!photoId) return;
  if (quiz.kind === "archetype") throw new AppError("invalid_image", 400);
  const upload = await getStore().getUpload(photoId);
  const expected = quiz.kind === "face_beauty" ? "face" : "body";
  if (!upload || upload.ownerUid !== user.id || upload.deletedAt || upload.role !== expected || !upload.consentAt) {
    throw new AppError("invalid_image", 400);
  }
  upload.linked = true;
  upload.sessionId = quiz.id;
  await getStore().saveUpload(upload);
  quiz.photoUploadId = upload.id;
}

async function quizPhoto(quiz: AiQuizRecord) {
  if (!quiz.photoUploadId || quiz.kind === "archetype") return undefined;
  const upload = await getStore().getUpload(quiz.photoUploadId);
  if (!upload || upload.ownerUid !== quiz.ownerUid || upload.deletedAt) return undefined;
  const object = await getStore().getObject(upload.path);
  if (!object?.bytes.length) return undefined;
  return { referencePhoto: object.bytes, mime: upload.contentType };
}

function scheduleReport(quiz: AiQuizRecord) {
  if (quiz.paymentStatus !== "paid" || quiz.reportStatus === "sent") return;
  try {
    after(() => fulfillAiQuiz(quiz.id));
  } catch {
    void fulfillAiQuiz(quiz.id);
  }
}

function publicQuiz(quiz: AiQuizRecord) {
  const paid = quiz.paymentStatus === "paid";
  const qrImage = quiz.qrImage
    ? quiz.qrImage.startsWith("data:")
      ? quiz.qrImage
      : `data:image/png;base64,${quiz.qrImage}`
    : undefined;
  return {
    id: quiz.id,
    kind: quiz.kind,
    amount: quiz.amount,
    currency: quiz.currency,
    paymentStatus: quiz.paymentStatus,
    email: quiz.email,
    qrImage,
    urls: quiz.urls,
    simulate: simulatePayAllowed() && quiz.paymentStatus !== "paid",
    reportStatus: quiz.reportStatus,
    brief: paid ? quiz.brief : null,
  };
}

async function loadOwned(user: User, id: string) {
  const quiz = await loadQuiz(id);
  if (quiz.ownerUid !== user.id) throw new AppError("not_found", 404);
  return quiz;
}

async function loadQuiz(id: string) {
  if (!id.startsWith("aiq_")) throw new AppError("not_found", 404);
  const quiz = await getStore().getAiQuiz(id);
  if (!quiz) throw new AppError("not_found", 404);
  return quiz;
}

function parseKind(value: string): AiQuizKind {
  if (KINDS.includes(value as AiQuizKind)) return value as AiQuizKind;
  throw new AppError("quiz_unavailable", 404);
}
