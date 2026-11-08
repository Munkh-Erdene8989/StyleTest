import { AppError } from "@/domain/errors";
import { yearMonth } from "@/domain/profile";
import type { StyleQuizRecord } from "@/domain/style-quiz";
import type { Report, User } from "@/domain/types";
import { downloadAiQuizPdf } from "./ai-quiz-service";
import { REPORT_LOGO, printHtmlToPdf } from "./face-report-pdf";
import { downloadTapPdf } from "./tap-service";
import { getStore } from "./store";

export async function profileReportPdf(user: User, id: string) {
  if (id.startsWith("aiq_")) return aiFile(user, id);
  if (id.startsWith("tap_")) return tapFile(user, id);
  if (id.startsWith("quiz_")) return styleFile(user, id);
  if (id.startsWith("rep_")) return classicFile(user, id);
  throw new AppError("not_found", 404);
}

async function aiFile(user: User, id: string) {
  const quiz = await getStore().getAiQuiz(id);
  if (!quiz) throw new AppError("not_found", 404);
  const when = yearMonth(quiz.paidAt ?? quiz.createdAt);
  const bytes = await downloadAiQuizPdf(user, id);
  return { bytes, filename: stamped("naruka-report", when) };
}

async function tapFile(user: User, id: string) {
  const tap = await getStore().getTap(id);
  if (!tap) throw new AppError("not_found", 404);
  const when = yearMonth(tap.paidAt ?? tap.createdAt);
  const bytes = await downloadTapPdf(user, id);
  return { bytes, filename: stamped("naruka-1-tap", when) };
}

async function styleFile(user: User, id: string) {
  const quiz = await getStore().getStyleQuiz(id);
  const sameAccount = quiz?.ownerUid === user.id || Boolean(user.email && quiz?.email.toLowerCase() === user.email.toLowerCase());
  if (!quiz || !sameAccount) throw new AppError("not_found", 404);
  const when = yearMonth(quiz.paidAt ?? quiz.createdAt);
  const bytes = await printHtmlToPdf(summaryHtml({
    title: "Стайлын зөвлөмж",
    when: when?.label ?? "",
    body: `${quiz.name} бөглөсөн стайлын тест.`,
    paragraphs: styleLines(quiz),
  }));
  return { bytes, filename: stamped("naruka-style", when) };
}

async function classicFile(user: User, id: string) {
  const store = getStore();
  const report = await store.getReport(id);
  if (!report || report.ownerUid !== user.id) throw new AppError("not_found", 404);
  const entitlement = (await store.listEntitlementsByOwner(user.id)).find((item) => item.targetId === report.id);
  const reveal = report.priceMnt === 0 || entitlement?.status === "active";
  const when = yearMonth(report.createdAt);
  const bytes = await printHtmlToPdf(summaryHtml({
    title: report.summary.title,
    when: when?.label ?? "",
    body: report.summary.body,
    paragraphs: reveal ? textBlocks(report) : report.outline,
    disclaimer: report.summary.disclaimer,
  }));
  return { bytes, filename: stamped("naruka-report", when) };
}

function styleLines(quiz: StyleQuizRecord) {
  return Object.values(quiz.answers).flatMap((answer) => {
    const value = Array.isArray(answer.value) ? answer.value.join(", ") : String(answer.value);
    const lines = [`${answer.label}: ${value}`];
    if (answer.insight) lines.push(answer.insight);
    return lines;
  });
}

function textBlocks(report: Report) {
  const content = report.fullContent;
  if (!content || typeof content !== "object") return report.outline;
  const record = content as { paragraphs?: unknown; sections?: unknown };
  const paragraphs = strings(record.paragraphs);
  if (paragraphs.length) return paragraphs;
  if (!Array.isArray(record.sections)) return report.outline;
  const lines = record.sections.flatMap((section) => {
    if (!section || typeof section !== "object") return [];
    const heading = (section as { heading?: unknown }).heading;
    const body = (section as { body?: unknown }).body;
    return [heading, body].filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  });
  return lines.length ? lines : report.outline;
}

function strings(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function summaryHtml(input: { title: string; when: string; body: string; paragraphs: string[]; disclaimer?: string }) {
  const blocks = input.paragraphs.map((line) => `<p>${esc(line)}</p>`).join("");
  const note = input.disclaimer ? `<p class="note">${esc(input.disclaimer)}</p>` : "";
  return `<!doctype html><html lang="mn"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600&family=Noto+Serif:wght@600&display=swap">
<style>
  body { margin: 32mm 18mm 18mm; color: #1e1a18; font-family: "Noto Sans", sans-serif; font-size: 12pt; line-height: 1.55; }
  .logo { position: fixed; top: 8mm; left: 18mm; height: 16mm; width: auto; }
  h1 { margin: 0 0 0.6rem; font-family: "Noto Serif", serif; font-weight: 600; font-size: 22pt; }
  .when { margin: 0 0 1rem; color: #8a7f79; }
  .note { margin-top: 1.4rem; color: #3a3330; font-size: 10pt; }
</style></head><body>
<img class="logo" alt="Naruka Styling Studio" src="${REPORT_LOGO}">
<p class="when">${esc(input.when)}</p>
<h1>${esc(input.title)}</h1>
<p>${esc(input.body)}</p>
${blocks}
${note}
</body></html>`;
}

function stamped(prefix: string, when: { year: number; month: number } | null) {
  const stamp = when ? `-${when.year}-${String(when.month).padStart(2, "0")}` : "";
  return `${prefix}${stamp}.pdf`;
}

function esc(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}
