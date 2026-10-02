import { randomUUID } from "crypto";
import { after } from "next/server";
import { quizByKind } from "@/content/quizzes/catalog";
import type { AiQuizKind, AiQuizRecord } from "@/domain/ai-quiz";
import { scoreAiQuiz } from "@/domain/ai-quiz-score";
import { AppError } from "@/domain/errors";
import { STYLE_QUIZ_PRICE_MNT } from "@/domain/money";
import { verifyObservation } from "@/domain/payment";
import { iso } from "@/domain/time";
import type { User } from "@/domain/types";
import { providers } from "./ai";
import { bodyQuizBank, loadArchetypeBank, normalizeAnswers } from "./ai-quiz-banks";
import { sendEmail } from "./email";
import { limit } from "./limit";
import { checkInvoice, createInvoice, simulatePayAllowed } from "./qpay";
import { getStore } from "./store";

const KINDS: AiQuizKind[] = ["face_beauty", "body_shape", "archetype"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createAiQuizCheckout(user: User, input: { kind: string; answers: unknown; email: string }) {
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
  return settleAiQuiz(quiz.id, observed);
}

export async function simulateAiQuiz(user: User, id: string) {
  if (!simulatePayAllowed()) throw new AppError("simulate_disabled", 403);
  const quiz = await loadOwned(user, id);
  return settleAiQuiz(quiz.id, {
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

export async function applyAiQuizCallback(body: Record<string, unknown>, queryInvoice?: string) {
  const invoiceId = stringValue(body.invoice_id) || stringValue(body.object_id) || queryInvoice || "";
  const sender = stringValue(body.sender_invoice_no);
  const store = getStore();
  const quiz = invoiceId ? await store.findAiQuizByInvoice(invoiceId) : sender.startsWith("aiq_") ? await store.getAiQuiz(sender) : null;
  if (!quiz?.qpayInvoiceId) throw new AppError("not_found", 404);
  const observed = await checkInvoice(quiz.qpayInvoiceId);
  const result = await settleAiQuiz(quiz.id, observed);
  return { ok: true, duplicate: result.duplicate };
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
    let detail = current.detail;
    if (!detail) {
      const scored = scoreAiQuiz(current.kind, current.answers, { body: bodyQuizBank(), archetype: loadArchetypeBank() });
      const draft = await providers.explainAiQuiz({ kind: current.kind, brief: scored.brief, answers: scored.labels });
      if (!draft) throw new Error("openai_unconfigured");
      detail = draft;
      await store.updateAiQuiz(id, (quiz) => ({ ...quiz, detail }));
    }
    await sendEmail({
      to: current.email,
      subject: `Naruka — ${quizByKind(current.kind)?.title ?? "тайлан"}`,
      text: reportText(quizByKind(current.kind)?.title ?? "тайлан", detail),
    });
    await store.updateAiQuiz(id, (quiz) => ({ ...quiz, detail, reportStatus: "sent" }));
  } catch (error) {
    console.error("ai_quiz_report_failed", error instanceof Error ? error.message.slice(0, 180) : "unknown");
    await store.updateAiQuiz(id, (quiz) => ({ ...quiz, reportStatus: "failed" }));
  }
}

async function settleAiQuiz(id: string, observed: Parameters<typeof verifyObservation>[1]) {
  const store = getStore();
  const current = await store.getAiQuiz(id);
  if (!current) throw new AppError("not_found", 404);
  if (current.paymentStatus === "paid") {
    scheduleReport(current);
    return { duplicate: true, quiz: publicQuiz(current), reason: "duplicate" };
  }
  const verdict = verifyObservation(current, observed);
  if (!verdict.ok) return { duplicate: false, quiz: publicQuiz(current), reason: verdict.reason };
  const scored = scoreAiQuiz(current.kind, current.answers, { body: bodyQuizBank(), archetype: loadArchetypeBank() });
  const { next } = await store.updateAiQuiz(id, (quiz) => {
    if (quiz.paymentStatus === "paid") return quiz;
    return {
      ...quiz,
      paymentStatus: "paid",
      qpayPaymentId: observed.paymentId ?? undefined,
      paidAt: iso(),
      brief: scored.brief,
    };
  });
  scheduleReport(next);
  return { duplicate: false, quiz: publicQuiz(next), reason: "paid" };
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

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function reportText(title: string, detail: { summary: string; sections: { heading: string; body: string }[] }) {
  const sections = detail.sections.map((section) => `${section.heading}\n${section.body}`).join("\n\n");
  return [`Сайн байна уу.`, "", `Таны Naruka ${title} бэлэн боллоо.`, "", detail.summary, "", sections, "", "— Naruka Styling Studio"].join("\n");
}
