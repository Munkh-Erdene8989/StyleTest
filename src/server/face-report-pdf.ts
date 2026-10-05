import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { PDFDocument } from "pdf-lib";
import type { AiQuizBrief, AiQuizDetail, AiQuizKind, AiQuizRecord, AiQuizSection } from "@/domain/ai-quiz";
import { scoreAiQuiz } from "@/domain/ai-quiz-score";
import { imageFormatOk } from "@/domain/images";
import { bodyQuizBank, loadArchetypeBank } from "./ai-quiz-banks";
import { developerPrompt, MANIFESTS, SECTION_LABEL, userMessage, type ReportLayout } from "./report-prompts";
import { getStore } from "./store";

const execFileAsync = promisify(execFile);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const LOGO_SRC = `data:image/jpeg;base64,${readFileSync(path.join(process.cwd(), "public/naruka-report-logo.jpg")).toString("base64")}`;

export const FACE_MANIFEST = MANIFESTS.face_beauty;

export type FaceRecommendation = { action_mn: string; why_mn: string };
export type FacePageCopy = {
  page_number: number;
  intro_mn: string;
  notes_mn: string;
  recommendations: FaceRecommendation[];
};
export type FacePaletteColor = { id: string; name_mn: string; hex: string; role: "neutral" | "accent" | "makeup" };
export type FaceDraft = {
  reportId: string;
  briefSections: AiQuizSection[];
  palette: FacePaletteColor[];
  images: Record<number, string>;
  pages: FacePageCopy[];
  hasReference?: boolean;
};

export function reportObjectKey(quizId: string, kind: AiQuizKind = "face_beauty", withPhoto = false) {
  return `reports/${quizId}/${kind}${withPhoto ? "-photo" : ""}-v4.pdf`;
}

export async function ensureFaceReportPdf(quiz: AiQuizRecord) {
  if (quiz.kind !== "face_beauty") throw new Error("face_only");
  return ensureQuizReportPdf(quiz);
}

export async function ensureQuizReportPdf(quiz: AiQuizRecord, options?: { referencePhoto?: Buffer }) {
  const store = getStore();
  const referencePhoto = options?.referencePhoto?.length ? options.referencePhoto : undefined;
  const key = reportObjectKey(quiz.id, quiz.kind, Boolean(referencePhoto));
  const cached = await store.getObject(key);
  if (cached) {
    try {
      return await assertLandscapePdf(cached.bytes);
    } catch {
      // A stored file that is not 25 landscape pages is rebuilt once.
    }
  }
  const scored = scoreAiQuiz(quiz.kind, quiz.answers, { body: bodyQuizBank(), archetype: loadArchetypeBank() });
  const draft = await draftQuizReport({
    kind: quiz.kind,
    reportId: quiz.id,
    brief: quiz.brief ?? scored.brief,
    detail: quiz.detail,
    evidence: scored.labels,
    referencePhoto,
  });
  const pdf = await assertLandscapePdf(await printHtmlToPdf(renderQuizReportHtml(draft, quiz.kind)));
  await store.putObject(key, pdf, "application/pdf");
  return pdf;
}

export async function draftQuizReport(input: {
  kind: AiQuizKind;
  reportId: string;
  brief: AiQuizBrief | null;
  detail: AiQuizDetail | null;
  evidence: { question: string; answer: string }[];
  referencePhoto?: Buffer;
}): Promise<FaceDraft> {
  if (!process.env.OPENAI_API_KEY) throw new Error("openai_unconfigured");
  const manifest = MANIFESTS[input.kind];
  const hasReference = Boolean(input.referencePhoto?.length);
  const evidence = input.evidence.slice(0, 40).map((item) => ({ question: item.question, answer: item.answer }));
  const context = {
    quiz_type: input.kind,
    personal_visuals_mode: hasReference ? "reference_photo" : "inspiration_only",
    brief: input.brief,
    detail: input.detail ? { summary: input.detail.summary, sections: input.detail.sections } : null,
    evidence,
    limitation: hasReference
      ? "Хэрэглэгч нэг нүүрний зураг оруулсан. Жишээ зургийг тэр зурган дээр үндэслэнэ. Өрөөнд байсан бусад хүнийг бүү оруул."
      : "Хэрэглэгчийн зураг байхгүй. Жишээ зургийг насанд хүрсэн маникен дээр харуулна. Хэрэглэгчийн хөрөг биш.",
  };
  const palette = await withRetry(() => paletteCall(input.kind, context));
  const byNumber = new Map<number, FacePageCopy>();
  let empty = 0;
  for (let attempt = 0; attempt < 8 && byNumber.size < 25; attempt += 1) {
    const expected = manifest.map((item) => item.page).filter((page) => !byNumber.has(page)).slice(0, 5);
    const batch = await withRetry(() => pageCall(input.kind, context, expected));
    for (const page of batch) byNumber.set(page.page_number, page);
    empty = batch.length === 0 ? empty + 1 : 0;
    if (empty >= 2) break;
  }
  const missing = manifest.map((item) => item.page).filter((page) => !byNumber.has(page));
  if (missing.length) throw new Error(`pages_incomplete:${missing.join(",")}`);
  const pages = manifest.map((item) => byNumber.get(item.page)!);
  const images: Record<number, string> = {};
  await pool(manifest, 1, async (item) => {
    const copy = pages.find((page) => page.page_number === item.page);
    const size = input.kind === "body_shape" ? "1024x1536" : "1024x1024";
    images[item.page] = await exampleImage(examplePrompt(input.kind, item.title, item.objective, copy?.recommendations[0]?.action_mn, hasReference), input.referencePhoto, size);
  });
  return {
    reportId: input.reportId,
    briefSections: input.brief?.sections ?? [],
    palette,
    images,
    pages,
    hasReference,
  };
}

export function renderFaceReportHtml(draft: FaceDraft) {
  return renderQuizReportHtml(draft, "face_beauty");
}

export function renderQuizReportHtml(draft: FaceDraft, kind: AiQuizKind) {
  const manifest = MANIFESTS[kind];
  if (draft.pages.length !== 25) throw new Error("pages_incomplete");
  const numbers = draft.pages.map((page) => page.page_number);
  if (numbers.join() !== manifest.map((item) => item.page).join()) throw new Error("pages_incomplete");
  const shortId = draft.reportId.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  const pages = manifest.map((item, index) => {
    const copy = draft.pages[index];
    const figure = draft.images[item.page]
      ? `<figure><img class="still" alt="${draft.hasReference ? "Оруулсан зураг дээрх жишээ" : "Маникен дээрх жишээ"}" src="${draft.images[item.page]}"><figcaption>${draft.hasReference ? "Оруулсан зураг дээр үндэслэсэн жишээ." : "Жишээ зураг · маникен. Хэрэглэгчийн зураг биш."}</figcaption></figure>`
      : "";
    const body = figure
      ? `<div class="split">${figure}<div class="copy">${layoutHtml(item.layout, item.page, copy, draft)}</div></div>`
      : layoutHtml(item.layout, item.page, copy, draft);
    return `<section class="report-page">
      <header class="mast"><img class="logo" alt="Naruka Styling Studio" src="${LOGO_SRC}"><div><p>Naruka</p><h1>${esc(item.title)}</h1></div></header>
      ${body}
      <footer><span>${esc(shortId)}</span><span>${esc(SECTION_LABEL[kind])}</span><span>${item.page}/25</span></footer>
    </section>`;
  }).join("");
  return `<!doctype html><html lang="mn"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Serif:wght@600&display=swap">
<style>
@page { size: A4 landscape; margin: 0; }
html, body { margin: 0; padding: 0; background: #FAF7F2; color: #29272A; }
.report-page { width: 297mm; height: 210mm; padding: 11mm 14mm 13mm 16mm; box-sizing: border-box; break-after: page; break-inside: avoid; page-break-inside: avoid; position: relative; overflow: hidden; background: #F7F3ED; }
.report-page::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3.2mm; background: #1C1A1B; }
.report-page:last-child { break-after: auto; }
.mast { display: flex; align-items: flex-end; gap: 5mm; margin: 0 0 3.5mm; padding-bottom: 2mm; border-bottom: 0.35mm solid #1C1A1B; }
.logo { height: 13mm; width: auto; }
header p { display: none; }
h1 { margin: 0; font: 600 17pt/1.15 "Noto Serif", serif; letter-spacing: -0.01em; }
.split { display: grid; grid-template-columns: 86mm 1fr; gap: 6mm; align-items: start; }
figure { margin: 0; }
figcaption { margin-top: 1.5mm; font: 8.5pt/1.35 "Noto Sans", sans-serif; color: #6B625C; }
.intro { margin: 0 0 3.5mm; font: 12pt/1.45 "Noto Serif", serif; }
.note { margin: 3mm 0 0; font: 9pt/1.35 "Noto Sans", sans-serif; color: #6D2438; }
.cards { display: flex; flex-direction: column; gap: 2.6mm; }
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
.compare-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.compare-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3.5mm; }
.card { border-left: 0.45mm solid #6D2438; padding: 0.4mm 0 0.4mm 3mm; }
.card strong { display: block; margin-bottom: 0.6mm; font: 600 11pt/1.3 "Noto Serif", serif; }
.card span, .swatch span { display: block; font: 10pt/1.35 "Noto Sans", sans-serif; }
.swatches { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2.5mm; }
.swatch { background: white; padding: 2mm; }
.swatch strong { display: block; margin-bottom: 0.4mm; font: 600 8.5pt "Noto Sans", sans-serif; }
.chip { height: 14mm; }
.still { width: 86mm; height: 124mm; object-fit: cover; object-position: center 18%; background: #EFEAE3; }
footer { position: absolute; left: 16mm; right: 14mm; bottom: 6mm; display: flex; justify-content: space-between; border-top: 0.2mm solid #DDD4C8; padding-top: 1.6mm; font: 8.5pt "Noto Sans", sans-serif; color: #6B625C; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head><body>${pages}</body></html>`;
}

export async function printHtmlToPdf(html: string) {
  const dir = await mkdtemp(path.join(tmpdir(), "naruka-pdf-"));
  const htmlPath = path.join(dir, "report.html");
  const pdfPath = path.join(dir, "report.pdf");
  await writeFile(htmlPath, html);
  try {
    await execFileAsync(CHROME, [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--virtual-time-budget=45000",
      `--print-to-pdf=${pdfPath}`,
      `file://${htmlPath}`,
    ], { timeout: 120_000 });
    return await readFile(pdfPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function assertLandscapePdf(bytes: Buffer) {
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  if (pages.length !== 25) throw new Error(`pdf_pages_${pages.length}`);
  for (const page of pages) {
    const { width, height } = page.getSize();
    if (width + 1 < height) throw new Error("pdf_portrait");
    if (Math.abs(width - 841.89) > 12 || Math.abs(height - 595.28) > 12) throw new Error(`pdf_media_${Math.round(width)}x${Math.round(height)}`);
  }
  return bytes;
}

function layoutHtml(layout: ReportLayout, page: number, copy: FacePageCopy, draft: FaceDraft) {
  const intro = `<p class="intro">${esc(clip(copy.intro_mn, 520))}</p>`;
  const note = `<p class="note">${esc(clip(copy.notes_mn || (draft.hasReference ? "Жишээ зураг оруулсан зураг дээр үндэслэсэн." : "Жишээ зураг нь маникен дээрх загвар. Хэрэглэгчийн зураг биш."), 220))}</p>`;
  if (layout === "cover") {
    return `${intro}${cards(copy.recommendations)}${note}`;
  }
  if (layout === "dashboard") {
    const metrics = draft.briefSections.slice(0, 4);
    const body = metrics.length
      ? `<div class="cards">${metrics.map((item) => `<article class="card"><strong>${esc(item.heading)}</strong><span>${esc(clip(item.body, 180))}</span></article>`).join("")}</div>`
      : cards(copy.recommendations);
    return `${intro}${body}${note}`;
  }
  if (layout === "palette") {
    return `${intro}<div class="swatches">${draft.palette.map((color) => `<article class="swatch"><div class="chip" style="background:${esc(color.hex)}"></div><strong>${esc(color.name_mn)}</strong><span>${esc(color.hex)} · ${esc(color.role)}</span></article>`).join("")}</div><p class="note">HEX нь дизайн лавлагаа. Будгийн бодит өнгө биш.</p>`;
  }
  if (layout === "compare_two") return `${intro}<div class="compare-2">${pair(copy)}</div>${note}`;
  if (layout === "compare_three") return `${intro}<div class="compare-3">${copy.recommendations.slice(0, 3).map(card).join("")}</div>${note}`;
  if (layout === "detail_steps" || layout === "action_plan") return `${intro}<div class="steps">${copy.recommendations.slice(0, 3).map(card).join("")}</div>${note}`;
  if (layout === "grid" || layout === "table" || layout === "capsule") {
    return `${intro}${cards(copy.recommendations)}${note}`;
  }
  return `${intro}${cards(copy.recommendations)}${note}`;
}

function cards(items: FaceRecommendation[]) {
  return `<div class="cards">${items.slice(0, 3).map(card).join("")}</div>`;
}

function pair(copy: FacePageCopy) {
  const items = copy.recommendations.slice(0, 2);
  return items.map(card).join("");
}

function card(item: FaceRecommendation) {
  return `<article class="card"><strong>${esc(clip(item.action_mn, 140))}</strong><span>${esc(clip(item.why_mn, 220))}</span></article>`;
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function textField(entry: object, key: string) {
  const value = (entry as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function esc(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

async function paletteCall(kind: AiQuizKind, context: unknown) {
  const json = await completeJson(kind, "report_palette", {
    type: "object",
    additionalProperties: false,
    properties: {
      colors: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            name_mn: { type: "string" },
            hex: { type: "string" },
            role: { type: "string", enum: ["neutral", "accent", "makeup"] },
          },
          required: ["id", "name_mn", "hex", "role"],
        },
      },
    },
    required: ["colors"],
  }, userMessage({ ...((context as object) ?? {}), task: "12 өнгө: neutral 4, accent 4, makeup 4. HEX нь #RRGGBB. Дизайн лавлагаа, будгийн баталгаа биш." }, MANIFESTS[kind].filter((item) => item.layout === "palette")));
  return asPalette(json);
}

async function pageCall(kind: AiQuizKind, context: unknown, expected: number[]) {
  const manifest = MANIFESTS[kind].filter((item) => expected.includes(item.page));
  const json = await completeJson(kind, "report_pages", {
    type: "object",
    additionalProperties: false,
    properties: {
      pages: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            page_number: { type: "integer" },
            intro_mn: { type: "string" },
            notes_mn: { type: "string" },
            recommendations: {
              type: "array",
              minItems: 2,
              maxItems: 3,
              items: {
                type: "object",
                additionalProperties: false,
                properties: { action_mn: { type: "string" }, why_mn: { type: "string" } },
                required: ["action_mn", "why_mn"],
              },
            },
          },
          required: ["page_number", "intro_mn", "notes_mn", "recommendations"],
        },
      },
    },
    required: ["pages"],
  }, userMessage(context, manifest));
  return asPages(json);
}

function paletteRole(value: unknown): FacePaletteColor["role"] | null {
  if (value === "neutral" || value === "accent" || value === "makeup") return value;
  return null;
}

function asPalette(value: unknown): FacePaletteColor[] {
  const colors = Array.isArray((value as { colors?: unknown })?.colors) ? (value as { colors: unknown[] }).colors : [];
  const parsed = colors.flatMap((item): FacePaletteColor[] => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const role = paletteRole(row.role);
    const hex = typeof row.hex === "string" ? row.hex.trim() : "";
    const name_mn = typeof row.name_mn === "string" ? row.name_mn.trim() : "";
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!role || !name_mn || !id || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return [];
    return [{ id, name_mn, hex, role }];
  });
  const picked = (["neutral", "accent", "makeup"] as const).flatMap((role) => parsed.filter((color) => color.role === role).slice(0, 4));
  if (picked.length !== 12) throw new Error("palette_incomplete");
  return picked;
}

function asPages(value: unknown) {
  const pages = Array.isArray((value as { pages?: unknown })?.pages) ? (value as { pages: unknown[] }).pages : [];
  const byNumber = new Map<number, FacePageCopy>();
  for (const item of pages) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const page_number = Number(row.page_number);
    const intro_mn = typeof row.intro_mn === "string" ? row.intro_mn.trim() : "";
    const notes_mn = typeof row.notes_mn === "string" ? row.notes_mn.trim() : "";
    const recommendations = Array.isArray(row.recommendations)
      ? row.recommendations.flatMap((entry) => {
          if (!entry || typeof entry !== "object") return [];
          const action_mn = textField(entry, "action_mn") || textField(entry, "what_mn");
          const why_mn = textField(entry, "why_mn") || textField(entry, "how_mn");
          if (!action_mn || !why_mn) return [];
          return [{ action_mn, why_mn }];
        }).slice(0, 3)
      : [];
    if (page_number < 1 || page_number > 25 || intro_mn.length < 2 || recommendations.length < 1) continue;
    byNumber.set(page_number, { page_number, intro_mn, notes_mn, recommendations });
  }
  return [...byNumber.values()];
}

function examplePrompt(kind: AiQuizKind, title: string, objective: string, action?: string, hasReference = false) {
  const idea = [title, objective, action].filter(Boolean).join(". ");
  if (hasReference) {
    const framing = kind === "face_beauty"
      ? "Keep a head-and-shoulders view."
      : "Keep the full body in frame from head to feet. Preserve body proportions. Do not slim, lengthen, or reshape the body. Show the outfit modest and fully clothed.";
    return `Edit the uploaded photo for a styling example. Keep the adult who is facing the camera: same face, age, and identity. Remove the room and every other person. Use a cream studio background and soft daylight. ${framing} Modest everyday clothing. Demonstrate: ${idea}. No text, no letters, no logo, no watermark.`;
  }
  const framing = kind === "face_beauty" ? "head-and-shoulders adult fashion mannequin" : "full-body adult fashion mannequin";
  return `Studio photograph of one ${framing} with a stylized adult Mongolian appearance, modest everyday clothing, cream background, soft daylight. Demonstrate this styling idea: ${idea}. No text, no letters, no logo, no watermark. This is a mannequin example, not a real customer.`;
}

async function pool<T>(items: T[], limit: number, run: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item) await run(item);
    }
  }));
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function exampleImage(prompt: string, reference?: Buffer, size = "1024x1024") {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";
  let last = "image_failed";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = reference?.length
      ? await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          signal: AbortSignal.timeout(180_000),
          headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}` },
          body: editForm(model, prompt, reference, size),
        })
      : await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          signal: AbortSignal.timeout(180_000),
          headers: {
            authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model,
            prompt,
            size,
            quality: "medium",
            n: 1,
            output_format: "jpeg",
          }),
        });
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitSec = Math.min(45, Math.max(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 0, 10 * (attempt + 1)));
      await delay(waitSec * 1000);
      last = "image_http_429";
      continue;
    }
    if (!response.ok) {
      const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 160);
      last = `image_http_${response.status}:${detail}`;
      await delay(2000);
      continue;
    }
    const json = (await response.json()) as { data?: { b64_json?: string }[] };
    const data = json.data?.[0]?.b64_json;
    if (!data) {
      last = "image_empty";
      continue;
    }
    const bytes = Buffer.from(data, "base64");
    const contentType = imageFormatOk(bytes, "image/jpeg") ? "image/jpeg" : imageFormatOk(bytes, "image/png") ? "image/png" : "";
    if (!contentType) {
      last = "image_invalid";
      continue;
    }
    return `data:${contentType};base64,${data}`;
  }
  throw new Error(last);
}

function editForm(model: string, prompt: string, reference: Buffer, size: string) {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("quality", "medium");
  form.append("n", "1");
  form.append("output_format", "jpeg");
  form.append("image[]", new Blob([new Uint8Array(reference)], { type: "image/jpeg" }), "face.jpg");
  return form;
}

async function completeJson(kind: AiQuizKind, name: string, schema: object, user: string) {
  const model = process.env.OPENAI_REPORT_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-6-astra";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(180_000),
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 12000,
      input: [
        { role: "developer", content: name === "report_pages"
          ? `${developerPrompt(kind)}\n\nСЕРВЕРИЙН ШИЙДВЭР: computed_result хангалттай. needs_input болон pages=[] бүү буцаа. PAGE_MANIFEST-ийн хуудас бүрийг стилист хүнд шууд хандаж, ойлгомжтой монголоор бөглө.`
          : developerPrompt(kind) },
        { role: "user", content: user },
      ],
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 180);
    throw new Error(`model_http_${response.status}:${detail}`);
  }
  const json = (await response.json()) as {
    status?: string;
    output_text?: string;
    output?: { content?: { type?: string; text?: string }[] }[];
  };
  if (json.status && json.status !== "completed") throw new Error("incomplete");
  const refused = json.output?.some((item) => item.content?.some((part) => part.type === "refusal"));
  if (refused) throw new Error("refused");
  const text = json.output_text || json.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text")?.text || "";
  return JSON.parse(text) as unknown;
}

async function withRetry<T>(run: () => Promise<T>) {
  try {
    return await run();
  } catch (error) {
    if (error instanceof Error && (error.message === "openai_unconfigured" || error.message === "refused")) throw error;
    return run();
  }
}
