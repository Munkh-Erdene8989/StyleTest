import { readFileSync } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import type { AiQuizBrief, AiQuizDetail, AiQuizKind, AiQuizRecord, AiQuizSection } from "@/domain/ai-quiz";
import { archetypeScores, labelQuizAnswers, type ArchetypeScore } from "@/domain/ai-quiz-score";
import { imageFormatOk } from "@/domain/images";
import { bodyQuizBank, loadArchetypeBank } from "./ai-quiz-banks";
import { analyzeReferencePhoto, type ClothingWardrobe, type PhotoAnalysis, type PhotoRole } from "./photo-analysis";
import { renderImage, responsesJson } from "./model-transport";
import { calloutAnchor, reportCss, reportDesign, stackCalloutYs } from "./report-design";
import { compliantReferencePrompt, compliantReferenceSize, developerPrompt, imageJobsFor, imagePrompt, MANIFESTS, SECTION_LABEL, userMessage } from "./report-prompts";
import { getStore } from "./store";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((item): item is string => Boolean(item));
const CHROMIUM_VERSION = "153.0.0";
const LOGO_SRC = `data:image/jpeg;base64,${readFileSync(path.join(process.cwd(), "public/naruka-report-logo.jpg")).toString("base64")}`;

export const FACE_MANIFEST = MANIFESTS.face_beauty;

export type FaceRecommendation = { action_mn: string; why_mn: string };
export type FaceCallout = { title: string; text: string; side: "L" | "R"; cx: number; cy: number; size: number };
export type FaceNote = { title: string; text: string };
export type FacePageCopy = {
  page_number: number;
  intro_mn: string;
  edit_en: string;
  recommendations: FaceRecommendation[];
  notes?: FaceNote[];
  callouts?: FaceCallout[];
};
export type FaceDraft = {
  reportId: string;
  briefSections: AiQuizSection[];
  images: Record<number, string>;
  captions: Record<number, string>;
  pages: FacePageCopy[];
  hasReference?: boolean;
  notice?: string;
  original?: string;
};
export type QuizReportFile = { pdf: Buffer; brief: AiQuizBrief; detail: AiQuizDetail };

export function reportObjectKey(quizId: string, kind: AiQuizKind = "face_beauty", withPhoto = false) {
  return `reports/${quizId}/${kind}${withPhoto ? "-photo" : ""}-v10.pdf`;
}

function metaKey(pdfKey: string) {
  return pdfKey.replace(/\.pdf$/, ".json");
}

export async function ensureFaceReportPdf(quiz: AiQuizRecord) {
  if (quiz.kind !== "face_beauty") throw new Error("face_only");
  return ensureQuizReportPdf(quiz);
}

async function cachedPdf(key: string) {
  const cached = await getStore().getObject(key);
  if (!cached) return null;
  try {
    return await assertLandscapePdf(cached.bytes);
  } catch {
    return null;
  }
}

async function cachedReport(key: string): Promise<QuizReportFile | null> {
  const pdf = await cachedPdf(key);
  if (!pdf) return null;
  const meta = await getStore().getObject(metaKey(key));
  if (!meta) return null;
  try {
    const parsed = JSON.parse(meta.bytes.toString("utf8")) as { brief?: AiQuizBrief; detail?: AiQuizDetail };
    if (!parsed.brief?.sections?.length || !parsed.detail?.summary) return null;
    return { pdf, brief: parsed.brief, detail: parsed.detail };
  } catch {
    return null;
  }
}

export async function ensureQuizReportPdf(quiz: AiQuizRecord, options?: { referencePhoto?: Buffer; mime?: string }): Promise<QuizReportFile> {
  const store = getStore();
  const referencePhoto = options?.referencePhoto?.length ? options.referencePhoto : undefined;
  const canPersonal = Boolean(referencePhoto);
  const plainKey = reportObjectKey(quiz.id, quiz.kind, false);
  if (!canPersonal) {
    const ready = await cachedReport(plainKey);
    if (ready) return ready;
  } else {
    const ready = await cachedReport(reportObjectKey(quiz.id, quiz.kind, true));
    if (ready) return ready;
  }
  const gate = await resolveReferencePhoto({ kind: quiz.kind, photo: referencePhoto, mime: options?.mime });
  if (!gate.personal) {
    const ready = await cachedReport(plainKey);
    if (ready) return ready;
  }
  const key = reportObjectKey(quiz.id, quiz.kind, gate.personal);
  const archetypeBank = quiz.kind === "archetype" ? loadArchetypeBank() : null;
  const savedDraft = await storedDraft(draftObjectKey(key));
  const draft = savedDraft ?? await draftQuizReport({
    kind: quiz.kind,
    reportId: quiz.id,
    answers: labelQuizAnswers(quiz.kind, quiz.answers, { body: bodyQuizBank(), archetype: archetypeBank }),
    dimensions: archetypeBank ? archetypeScores(archetypeBank, quiz.answers) : null,
    referencePhoto: gate.personal ? gate.photo : undefined,
    mime: gate.mime,
    notice: gate.notice,
    wardrobe: gate.wardrobe,
  });
  if (!savedDraft) {
    await store.putObject(draftObjectKey(key), Buffer.from(JSON.stringify(draft)), "application/json");
  }
  const copy = reportCopy(quiz.kind, draft);
  const pdf = await assertLandscapePdf(await printHtmlToPdf(renderQuizReportHtml(draft, quiz.kind)));
  await store.putObject(key, pdf, "application/pdf");
  await store.putObject(metaKey(key), Buffer.from(JSON.stringify(copy)), "application/json");
  return { pdf, ...copy };
}

export function reportCopy(kind: AiQuizKind, draft: FaceDraft): { brief: AiQuizBrief; detail: AiQuizDetail } {
  const manifest = MANIFESTS[kind];
  const sections = draft.pages.slice(0, 3).map((page, index) => ({
    heading: manifest[index]?.title ?? `Хуудас ${page.page_number}`,
    body: page.intro_mn,
  }));
  return {
    brief: { title: SECTION_LABEL[kind], status: "ready", sections: sections.slice(0, 1) },
    detail: { summary: draft.pages[0]?.intro_mn ?? "", sections },
  };
}

export async function draftQuizReport(input: {
  kind: AiQuizKind;
  reportId: string;
  answers: { question: string; answer: string }[];
  dimensions?: ArchetypeScore[] | null;
  referencePhoto?: Buffer;
  mime?: string;
  notice?: string;
  wardrobe?: ClothingWardrobe | null;
}): Promise<FaceDraft> {
  if (!process.env.OPENAI_API_KEY) throw new Error("openai_unconfigured");
  const manifest = MANIFESTS[input.kind];
  const hasReference = Boolean(input.referencePhoto?.length);
  const wardrobe = input.kind === "face_beauty" ? null : input.wardrobe ?? null;
  const context = {
    quiz_type: input.kind,
    personal_visuals_mode: hasReference ? "reference_photo" : "inspiration_only",
    wardrobe,
    ...(input.dimensions?.length ? { dimension_scores: input.dimensions } : {}),
    answers: input.answers.slice(0, 120),
    limitation: hasReference
      ? "Баталсан эх зураг байна. Зураг зөвхөн харагдах жишээ. Хариултыг зургаар үгүйсгэхгүй."
      : "Хэрэглэгчийн зураг ашиглахгүй. Жишээ зургийг насанд хүрсэн маникен эсвэл хүнгүй эд зүйл дээр харуулна.",
  };
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
  const captions: Record<number, string> = {};
  const jobs = imageJobsFor(input.kind);
  await pool(jobs, 1, async (job) => {
    const personal = hasReference && job.role !== "none";
    const size = job.kind === "outfit" ? "1024x1536" : "1024x1024";
    const variation = job.pages.map((page) => pages.find((item) => item.page_number === page)?.edit_en ?? "").filter(Boolean).join(" ");
    try {
      const image = await exampleImage(imagePrompt(job, personal, variation, wardrobe), personal ? input.referencePhoto : undefined, size, input.mime);
      for (const page of job.pages) {
        images[page] = image;
        captions[page] = "";
      }
    } catch (error) {
      console.error("report_image_skipped", job.id, error instanceof Error ? error.message.slice(0, 120) : "unknown");
    }
  });
  await alignCallouts(input.kind, pages, images);
  const original = hasReference
    ? `data:${input.mime || "image/jpeg"};base64,${input.referencePhoto!.toString("base64")}`
    : undefined;
  const copy = reportCopy(input.kind, { reportId: input.reportId, briefSections: [], images, captions, pages, hasReference, notice: input.notice, original });
  return {
    reportId: input.reportId,
    briefSections: copy.brief.sections,
    images,
    captions,
    pages,
    hasReference,
    notice: input.notice,
    original,
  };
}

const MANNEQUIN_NOTICE = "Оруулсан зураг хангалтгүй тул жишээ нь маникен дээр.";
const PREPARED_NOTICE = "Оруулсан зураг шаардлага хангаагүй тул түүнээс шаардлагад нийцсэн зураг үүсгэж ашиглав.";

type ReferenceAnalyzer = (args: { bytes: Buffer; mime: string; role: PhotoRole }) => Promise<PhotoAnalysis | null>;
type ReferenceRenderer = (args: { prompt: string; photo: Buffer; mime: string; size: string }) => Promise<{ bytes: Buffer; mime: string }>;

export async function resolveReferencePhoto(input: {
  kind: AiQuizKind;
  photo?: Buffer;
  mime?: string;
  analyze?: ReferenceAnalyzer;
  render?: ReferenceRenderer;
}) {
  const photo = input.photo;
  const mime = input.mime || "image/jpeg";
  if (!photo?.length) return { personal: false as const, wardrobe: null };
  const analyze = input.analyze ?? analyzeReferencePhoto;
  const role: PhotoRole = input.kind === "face_beauty" ? "face_front" : "body_front";
  const analysis = await analyze({ bytes: photo, mime, role });
  let wardrobe = wardrobeOf(analysis);
  if (analysis?.status === "ready") return { personal: true as const, photo, mime, wardrobe };
  try {
    const made = await (input.render ?? renderCompliantReference)({
      prompt: compliantReferencePrompt(input.kind, wardrobe),
      photo,
      mime,
      size: compliantReferenceSize(input.kind),
    });
    if (!made.bytes.length) return { personal: false as const, notice: MANNEQUIN_NOTICE, wardrobe };
    const again = await analyze({ bytes: made.bytes, mime: made.mime, role });
    wardrobe = wardrobeOf(again) ?? wardrobe;
    if (again?.status !== "ready") return { personal: false as const, notice: MANNEQUIN_NOTICE, wardrobe };
    return { personal: true as const, photo: made.bytes, mime: made.mime, notice: PREPARED_NOTICE, wardrobe };
  } catch {
    return { personal: false as const, notice: MANNEQUIN_NOTICE, wardrobe };
  }
}

function wardrobeOf(analysis: PhotoAnalysis | null): ClothingWardrobe | null {
  return analysis?.wardrobe === "womenswear" || analysis?.wardrobe === "menswear" ? analysis.wardrobe : null;
}

async function renderCompliantReference(args: { prompt: string; photo: Buffer; mime: string; size: string }) {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";
  const image = await renderImage({
    model,
    prompt: args.prompt,
    size: args.size,
    outputFormat: "jpeg",
    quality: "medium",
    timeoutMs: 180_000,
    reference: { bytes: args.photo, mime: args.mime },
  });
  const mime = imageFormatOk(image.bytes, "image/jpeg") ? "image/jpeg" : imageFormatOk(image.bytes, "image/png") ? "image/png" : "";
  if (!mime) throw new Error("image_invalid");
  return { bytes: image.bytes, mime };
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
  const thumbLabel = reportDesign().thumbnail.label;
  const pages = manifest.map((item, index) => {
    const copy = draft.pages[index];
    const src = draft.images[item.page];
    const before = draft.original || draft.images[1];
    const figure = src
      ? `<figure class="hero"><img alt="" src="${src}"></figure>${calloutHtml(copy.callouts ?? [], src)}${item.kind === "change" && before ? `<figure class="thumb"><img alt="" src="${before}"><figcaption><strong>${esc(thumbLabel)}</strong><span>Өөрчлөхийн өмнө</span></figcaption></figure>` : ""}`
      : "";
    const notice = item.page === 1 && draft.notice ? `<p class="notice">${esc(draft.notice)}</p>` : "";
    return `<section class="report-page frame-${item.kind}">
      <header class="mast"><img class="logo" alt="Naruka Styling Studio" src="${LOGO_SRC}"><h1>${esc(item.title)}</h1></header>
      ${figure}
      ${notice}
      ${copyHtml(copy)}
      <footer><span>${esc(shortId)}</span><span>${esc(SECTION_LABEL[kind])}</span><span>${item.page}/25</span></footer>
    </section>`;
  }).join("");
  return `<!doctype html><html lang="mn"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Noto+Sans:wght@400;600&family=Noto+Serif:wght@600&display=swap">
<style>
${reportCss()}
.thumb figcaption span { display: block; margin-top: 0.4mm; }
</style></head><body>${pages}</body></html>`;
}

function draftObjectKey(pdfKey: string) {
  return pdfKey.replace(/\.pdf$/, ".draft.json");
}

async function storedDraft(key: string): Promise<FaceDraft | null> {
  const stored = await getStore().getObject(key);
  if (!stored?.bytes.length) return null;
  try {
    const draft = JSON.parse(stored.bytes.toString("utf8")) as FaceDraft;
    if (draft.pages?.length !== 25 || !draft.reportId) return null;
    return draft;
  } catch {
    return null;
  }
}

async function localChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

function chromiumPackUrl() {
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_VERSION}/chromium-v${CHROMIUM_VERSION}-pack.${arch}.tar`;
}

export async function printHtmlToPdf(html: string) {
  const local = await localChrome();
  const { launch } = await import("puppeteer-core");
  const browser = local
    ? await launch({
      executablePath: local,
      headless: true,
      args: ["--disable-gpu", "--no-first-run", "--no-default-browser-check"],
    })
    : await launchServerless(launch);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      timeout: 60_000,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function launchServerless(launch: typeof import("puppeteer-core").launch) {
  const chromium = (await import("@sparticuz/chromium-min")).default;
  chromium.setGraphicsMode = false;
  return launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(chromiumPackUrl()),
    headless: "shell",
  });
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

function calloutHtml(callouts: FaceCallout[], src: string) {
  const sourcePx = reportDesign().photo.source_px;
  const placed = [...stackSide(callouts.filter((item) => item.side === "L")), ...stackSide(callouts.filter((item) => item.side === "R"))];
  return placed.map(({ item, y }) => {
    const box = calloutAnchor(item.side);
    const scale = Math.round((sourcePx / item.size) * 100);
    const px = Math.round((item.cx / sourcePx) * 1000) / 10;
    const py = Math.round((item.cy / sourcePx) * 1000) / 10;
    return `<div class="callout ${item.side}" style="left:${box.left.toFixed(2)}mm;top:${(y - box.radius).toFixed(2)}mm"><div class="zoom" style="background-image:url('${src}');background-position:${px}% ${py}%;background-size:${scale}%"></div><i class="leader"></i><p class="cap"><strong>${esc(item.title)}</strong><span>${esc(item.text)}</span></p></div>`;
  }).join("");
}

function stackSide(items: FaceCallout[]) {
  const ordered = [...items].sort((a, b) => a.cy - b.cy).slice(0, 3);
  const ys = stackCalloutYs(ordered.map((item) => item.cy));
  return ordered.map((item, index) => ({ item, y: ys[index] ?? 0 }));
}

function copyHtml(copy: FacePageCopy) {
  const step = copy.recommendations[0];
  return `<p class="lead">${esc(clip(copy.intro_mn, 90))}</p>${step ? `<p class="step">${esc(clip(step.action_mn, 70))}</p>` : ""}`;
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

async function pageCall(kind: AiQuizKind, context: unknown, expected: number[]) {
  const manifest = MANIFESTS[kind].filter((item) => expected.includes(item.page));
  const json = await completeJson(kind, userMessage(context, manifest));
  return asPages(json);
}

function asCalloutWords(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const title = textField(entry, "title");
    const text = textField(entry, "text");
    if (!title || !text) return [];
    return [{ title, text }];
  });
}

export function applyLocated(notes: FaceNote[], marks: unknown): FaceCallout[] {
  const located = Array.isArray(marks) ? marks : [];
  const used = new Set<number>();
  const placed = notes.flatMap((note): FaceCallout[] => {
    const title = words(note.title, 2);
    const text = words(note.text, 5);
    if (!title || !text) return [];
    const index = located.findIndex((mark, markIndex) => {
      if (used.has(markIndex) || !mark || typeof mark !== "object") return false;
      const name = textField(mark, "title").toLowerCase();
      return name === title.toLowerCase() || name === note.title.trim().toLowerCase();
    });
    if (index < 0) return [];
    used.add(index);
    const mark = located[index] as Record<string, unknown>;
    const side = mark.side === "L" || mark.side === "R" ? mark.side : null;
    const cx = Number(mark.cx);
    const cy = Number(mark.cy);
    const size = Number(mark.size);
    if (!side || !Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(size)) return [];
    return [{ title, text, side, cx: clampNum(cx, 0, 1024, 0), cy: clampNum(cy, 0, 1024, 0), size: clampNum(size, 80, 520, 160) }];
  });
  return [...placed.filter((item) => item.side === "L").slice(0, 3), ...placed.filter((item) => item.side === "R").slice(0, 3)];
}

export function placeCallout(jobId: string, callout: FaceCallout): FaceCallout | null {
  const zone = jobId.startsWith("hat") ? "hat"
    : jobId.startsWith("glasses") ? "glasses"
      : jobId.startsWith("hair") ? "hair"
        : jobId === "earrings" || jobId === "jewelry" ? "ear"
          : jobId === "necklace" ? "neck"
            : "face";
  let size = callout.size;
  if (zone === "hat") size = Math.max(size, 320);
  if (zone === "glasses") size = Math.max(size, 260);
  if (zone === "hair") size = Math.max(size, 240);
  const next = { ...callout, size: clampNum(size, 80, 520, 160) };
  if (zone === "hat" && next.cy > 340) return null;
  if (zone === "glasses" && (next.cy < 160 || next.cy > 640)) return null;
  if (zone === "hair" && next.cy > 420) return null;
  if (zone === "ear" && (next.cy < 220 || next.cy > 560)) return null;
  if (zone === "neck" && next.cy < 500) return null;
  return next;
}

async function alignCallouts(kind: AiQuizKind, pages: FacePageCopy[], images: Record<number, string>) {
  const groups = new Map<string, FacePageCopy[]>();
  for (const page of pages) {
    const src = images[page.page_number];
    if (!src || !page.notes?.length) continue;
    const list = groups.get(src) ?? [];
    list.push(page);
    groups.set(src, list);
  }
  const jobs = imageJobsFor(kind);
  const jobOf = (page: number) => jobs.find((job) => job.pages.includes(page))?.id ?? "";
  const keep = (page: FacePageCopy, located: Map<number, unknown[]>) => {
    const placed = applyLocated(page.notes ?? [], located.get(page.page_number) ?? []);
    page.callouts = placed.flatMap((item) => {
      const kept = placeCallout(jobOf(page.page_number), item);
      return kept ? [kept] : [];
    });
  };
  await pool([...groups.entries()], 2, async ([src, group]) => {
    const payload = group.map((page) => ({ page_number: page.page_number, notes: page.notes ?? [], edit_en: page.edit_en }));
    try {
      const located = await locateCallouts(src, payload, false);
      for (const page of group) keep(page, located);
      const missed = group.filter((page) => (page.notes?.length ?? 0) > 0 && (page.callouts?.length ?? 0) === 0);
      if (missed.length) {
        const again = await locateCallouts(src, missed.map((page) => ({ page_number: page.page_number, notes: page.notes ?? [], edit_en: page.edit_en })), true);
        for (const page of missed) keep(page, again);
      }
    } catch (error) {
      console.error("callout_align_skipped", error instanceof Error ? error.message.slice(0, 120) : "unknown");
      for (const page of group) page.callouts = [];
    }
  });
}

async function locateCallouts(src: string, pages: { page_number: number; notes: FaceNote[]; edit_en: string }[], again: boolean) {
  const model = process.env.OPENAI_REPORT_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-6-luna";
  const json = await responsesJson({
    model,
    timeoutMs: 90_000,
    maxOutputTokens: 2500,
    reasoningEffort: "low",
    developer: `${again ? "The previous points landed on skin or the wrong feature. Point only at the added object. " : ""}Point each title at the changed object on this exact photo. Coordinates are pixels in a 1024 square. Hat or brim: center on the hat, cy at most 320, size 300 to 460 so the whole hat is inside the square. Never point at a cheek. Glasses: center on the frame, size 240 to 400 so the rim is visible, not an eyelid crop. If the object is not in the photo, omit that title. side L is the viewer's left, R is the viewer's right.`,
    user: [
      { type: "input_text", text: JSON.stringify({ pages: pages.map((page) => ({ page_number: page.page_number, edit_en: page.edit_en, titles: page.notes.map((note) => note.title) })) }) },
      { type: "input_image", image_url: src, detail: "high" },
    ],
    schemaName: "callout_points",
    schema: {
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
              marks: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    side: { type: "string", enum: ["L", "R"] },
                    cx: { type: "integer" },
                    cy: { type: "integer" },
                    size: { type: "integer" },
                  },
                  required: ["title", "side", "cx", "cy", "size"],
                },
              },
            },
            required: ["page_number", "marks"],
          },
        },
      },
      required: ["pages"],
    },
  });
  const map = new Map<number, unknown[]>();
  const rows = Array.isArray((json as { pages?: unknown })?.pages) ? (json as { pages: unknown[] }).pages : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const page = Number((row as { page_number?: unknown }).page_number);
    const marks = (row as { marks?: unknown }).marks;
    if (page >= 1 && Array.isArray(marks)) map.set(page, marks);
  }
  return map;
}

function words(text: string, max: number) {
  return text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).slice(0, max).join(" ");
}

function clampNum(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function asPages(value: unknown) {
  const pages = Array.isArray((value as { pages?: unknown })?.pages) ? (value as { pages: unknown[] }).pages : [];
  const byNumber = new Map<number, FacePageCopy>();
  for (const item of pages) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const page_number = Number(row.page_number);
    const intro_mn = typeof row.intro_mn === "string" ? row.intro_mn.trim() : "";
    const edit_en = typeof row.edit_en === "string" ? row.edit_en.trim() : "";
    const recommendations = Array.isArray(row.recommendations)
      ? row.recommendations.flatMap((entry) => {
          if (!entry || typeof entry !== "object") return [];
          const action_mn = textField(entry, "action_mn");
          const why_mn = textField(entry, "why_mn");
          if (!action_mn || !why_mn) return [];
          return [{ action_mn, why_mn }];
        }).slice(0, 1)
      : [];
    if (page_number < 1 || page_number > 25 || intro_mn.length < 2 || recommendations.length < 1) continue;
    byNumber.set(page_number, { page_number, intro_mn, edit_en, recommendations, notes: asCalloutWords(row.callouts), callouts: [] });
  }
  return [...byNumber.values()];
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

async function exampleImage(prompt: string, reference?: Buffer, size = "1024x1024", mime = "image/jpeg") {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";
  const image = await renderImage({
    model,
    prompt,
    size,
    outputFormat: "jpeg",
    quality: "medium",
    timeoutMs: 180_000,
    reference: reference?.length ? { bytes: reference, mime } : undefined,
  });
  const contentType = imageFormatOk(image.bytes, "image/jpeg") ? "image/jpeg" : imageFormatOk(image.bytes, "image/png") ? "image/png" : "";
  if (!contentType) throw new Error("image_invalid");
  return `data:${contentType};base64,${image.base64}`;
}

async function completeJson(kind: AiQuizKind, user: string) {
  const model = process.env.OPENAI_REPORT_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-6-luna";
  const developer = `${developerPrompt(kind)}\n\nСЕРВЕРИЙН ШИЙДВЭР: хуудасны бүтэц түгжээтэй. pages хоосон бүү буцаа. PAGE_MANIFEST-ийн хуудас бүрийг стилист хүнд шууд хандаж, ойлгомжтой монголоор бөглө. Ангиллын код бүү буцаа.`;
  return responsesJson({
    model,
    timeoutMs: 180_000,
    maxOutputTokens: 12000,
    reasoningEffort: "low",
    developer,
    user,
    schemaName: "report_pages",
    schema: {
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
              edit_en: { type: "string" },
              recommendations: {
                type: "array",
                minItems: 1,
                maxItems: 1,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: { action_mn: { type: "string" }, why_mn: { type: "string" } },
                  required: ["action_mn", "why_mn"],
                },
              },
              callouts: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: { title: { type: "string" }, text: { type: "string" } },
                  required: ["title", "text"],
                },
              },
            },
            required: ["page_number", "intro_mn", "edit_en", "recommendations", "callouts"],
          },
        },
      },
      required: ["pages"],
    },
  });
}

async function withRetry<T>(run: () => Promise<T>) {
  try {
    return await run();
  } catch (error) {
    if (error instanceof Error && (error.message === "openai_unconfigured" || error.message === "refused")) throw error;
    return run();
  }
}
