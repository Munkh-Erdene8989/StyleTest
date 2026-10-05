import { randomUUID } from "crypto";
import { after } from "next/server";
import { AppError } from "@/domain/errors";
import { STYLE_QUIZ_PRICE_MNT } from "@/domain/money";
import { paymentRequired, type ObservedPayment } from "@/domain/payment";
import type { StyleQuizAnswer, StyleQuizRecord } from "@/domain/style-quiz";
import { iso } from "@/domain/time";
import { providers } from "./ai";
import { sendEmail } from "./email";
import { limit } from "./limit";
import { checkInvoice, createInvoice, simulatePayAllowed } from "./qpay";
import { settlePayment } from "./settlement";
import { getStore } from "./store";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createStyleQuizCheckout(input: { name: string; email: string; answers: unknown }) {
  const name = cleanText(input.name, 80);
  const email = cleanText(input.email, 160).toLowerCase();
  if (!name || !EMAIL.test(email)) throw new AppError("invalid_contact", 400);
  const answers = parseAnswers(input.answers);
  if (!Object.keys(answers).length) throw new AppError("answers_missing", 400);
  await limit(email, "style_quiz_create", 8);
  const quiz: StyleQuizRecord = {
    id: `quiz_${randomUUID()}`,
    name,
    email,
    answers,
    amount: STYLE_QUIZ_PRICE_MNT,
    currency: "MNT",
    paymentStatus: "invoiced",
    urls: [],
    reportStatus: "pending",
    createdAt: iso(),
  };
  if (!paymentRequired()) {
    quiz.paymentStatus = "paid";
    quiz.paidAt = iso();
    await getStore().saveStyleQuiz(quiz);
    scheduleReport(quiz);
    return publicQuiz(quiz);
  }
  const invoice = await createInvoice({
    id: quiz.id,
    amount: quiz.amount,
    description: "Naruka хувийн стайл тайлан",
  });
  quiz.qpayInvoiceId = invoice.invoiceId;
  quiz.qrImage = invoice.qrImage;
  quiz.urls = invoice.urls;
  await getStore().saveStyleQuiz(quiz);
  return publicQuiz(quiz);
}

export async function readStyleQuiz(id: string) {
  const quiz = await loadQuiz(id);
  return publicQuiz(quiz);
}

export async function confirmStyleQuiz(id: string) {
  await limit(id, "style_quiz_check", 90, 10 * 60 * 1000);
  const quiz = await loadQuiz(id);
  if (!quiz.qpayInvoiceId) throw new AppError("invoice_missing", 400);
  const observed = await checkInvoice(quiz.qpayInvoiceId);
  return applyStyleQuizObservation(quiz.id, observed);
}

export async function simulateStyleQuiz(id: string) {
  if (!simulatePayAllowed()) throw new AppError("simulate_disabled", 403);
  const quiz = await loadQuiz(id);
  return applyStyleQuizObservation(quiz.id, {
    paid: true,
    amount: quiz.amount,
    currency: "MNT",
    paymentId: `sim_${quiz.id}`,
    channel: "other",
  });
}

export async function fulfillStyleQuiz(id: string) {
  const store = getStore();
  const current = await store.getStyleQuiz(id);
  if (!current || current.paymentStatus !== "paid") return;
  if (current.reportStatus === "sent" || current.reportStatus === "sending") return;
  const { previous } = await store.updateStyleQuiz(id, (quiz) => {
    if (quiz.reportStatus === "sent" || quiz.reportStatus === "sending") return quiz;
    return { ...quiz, reportStatus: "sending" };
  });
  if (previous.reportStatus === "sent" || previous.reportStatus === "sending") return;
  try {
    const answers = Object.entries(current.answers).map(([key, answer]) => ({
      key,
      value: Array.isArray(answer.value) ? answer.value.join(",") : String(answer.value),
      label: answer.label,
      insight: answer.insight,
    }));
    const { draft } = await providers.explainStyleQuiz({ name: current.name, answers });
    await sendEmail({
      to: current.email,
      subject: "Naruka — таны хувийн стайл тайлан",
      text: reportText(current.name, draft),
    });
    await store.updateStyleQuiz(id, (quiz) => ({ ...quiz, reportStatus: "sent" }));
  } catch (error) {
    console.error("style_quiz_report_failed", error instanceof Error ? error.message.slice(0, 180) : "unknown");
    await store.updateStyleQuiz(id, (quiz) => ({ ...quiz, reportStatus: "failed" }));
  }
}

export async function applyStyleQuizObservation(id: string, observed: ObservedPayment) {
  const store = getStore();
  const current = await store.getStyleQuiz(id);
  if (!current) throw new AppError("not_found", 404);
  const settled = await settlePayment(current, observed, {
    commit: (stamp) =>
      store.updateStyleQuiz(id, (quiz) => {
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

function scheduleReport(quiz: StyleQuizRecord) {
  if (quiz.paymentStatus !== "paid" || quiz.reportStatus === "sent") return;
  try {
    after(() => fulfillStyleQuiz(quiz.id));
  } catch {
    void fulfillStyleQuiz(quiz.id);
  }
}

function publicQuiz(quiz: StyleQuizRecord) {
  const qrImage = quiz.qrImage
    ? quiz.qrImage.startsWith("data:")
      ? quiz.qrImage
      : `data:image/png;base64,${quiz.qrImage}`
    : undefined;
  return {
    id: quiz.id,
    amount: quiz.amount,
    currency: quiz.currency,
    paymentStatus: quiz.paymentStatus,
    email: quiz.email,
    qrImage,
    urls: quiz.urls,
    simulate: simulatePayAllowed() && quiz.paymentStatus !== "paid",
    reportStatus: quiz.reportStatus,
  };
}

async function loadQuiz(id: string) {
  if (!id.startsWith("quiz_")) throw new AppError("not_found", 404);
  const quiz = await getStore().getStyleQuiz(id);
  if (!quiz) throw new AppError("not_found", 404);
  return quiz;
}

function parseAnswers(raw: unknown): Record<string, StyleQuizAnswer> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const answers: Record<string, StyleQuizAnswer> = {};
  for (const [key, value] of Object.entries(raw).slice(0, 80)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Record<string, unknown>;
    const label = cleanText(row.label, 500);
    if (!label) continue;
    const insight = cleanText(row.insight, 800);
    const answerValue = normalizeValue(row.value);
    if (answerValue === null) continue;
    answers[cleanText(key, 80)] = { value: answerValue, label, insight };
  }
  return answers;
}

function normalizeValue(value: unknown): StyleQuizAnswer["value"] | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return cleanText(value, 500);
  if (Array.isArray(value)) {
    const items = value.filter((item) => typeof item === "string").map((item) => cleanText(item, 80)).filter(Boolean);
    return items.slice(0, 20);
  }
  return null;
}

function cleanText(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function reportText(
  name: string,
  draft: { season: string; summary: string; palette: string[]; sections: { heading: string; body: string }[] },
) {
  const sections = draft.sections.map((section) => `${section.heading}\n${section.body}`).join("\n\n");
  return [
    `Сайн байна уу, ${name}.`,
    "",
    "Таны Naruka хувийн стайл тайлан бэлэн боллоо.",
    "",
    `Өнгөний улирал: ${draft.season}`,
    draft.summary,
    "",
    `Палитр: ${draft.palette.join(", ")}`,
    "",
    sections,
    "",
    "— Naruka Styling Studio",
  ].join("\n");
}
