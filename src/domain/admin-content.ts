import { TESTS, VERSIONS } from "./content";
import { PRICES } from "./money";
import type { NewsPost, NewsSwatch } from "./news";
import type {
  MethodologyVersion,
  ProductCode,
  Question,
  ResultBand,
  TestDefinition,
  TestKind,
  VersionStatus,
} from "./types";

export type TestDraft = {
  test: TestDefinition;
  version: MethodologyVersion;
  rule: string;
  method: string;
  hidden: boolean;
  updatedAt: string;
};

export type AdminLibrary = {
  tests: TestDraft[];
  news: NewsPost[] | null;
};

export type CatalogTest = TestDraft & {
  builtin: boolean;
  span: { min: number; max: number };
  issues: string[];
};

const QUIZ_KINDS: TestKind[] = ["personality", "stress", "fun", "youth"];
const STATUSES: VersionStatus[] = ["demo", "license_pending", "approved"];
const SWATCHES: NewsSwatch[] = ["personality", "style", "earth"];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOKEN = /^[a-z0-9][a-z0-9-]{0,48}$/;

export function defaultMethod() {
  return "Асуулт бүрийн сонголт бүхэл оноотой. Бүх хариултын оноог нэмж нийлбэр гаргана. Нийлбэр аль үр дүнгийн доод ба дээд хязгаарт багтаж байгаагаар бүлэг сонгогдоно. Муж давхцахгүй, завсаргүй байна. AI энэ оноог өөрчлөхгүй. Тайлан зөвхөн сонгогдсон бүлгийн тайлбарыг бичнэ.";
}

export function defaultRule(kind: TestKind) {
  if (kind === "personality") {
    return "Үзүүлэх асуулга. Лицензтэй хэмжүүр биш. Товч үр дүн үнэгүй. Дэлгэрэнгүй тайланг AI, төлбөр төлсний дараа, урьдчилан заасан гарчгийн дагуу бичнэ.";
  }
  if (kind === "stress") {
    return "Сүүлийн 7 хоногийн өөрийн тэмдэглэл. Онош биш. Үр дүн үнэгүй. Өндөр ачааллын бүлэгт тусламжийн холбоо харагдана. Баталгаажсан хувилбар гаргахад тусламжийн холбоо, лиценз, орчуулгын хяналт шаардлагатай.";
  }
  if (kind === "fun") {
    return "Хөгжилтэй тест. Шинжлэх ухааны үнэлгээ биш. Үр дүн үнэгүй. Бүлгийн гарчиг, товчийн текстийг админаас сольж болно.";
  }
  if (kind === "youth") {
    return "18-аас доош насанд зориулсан богино асуулга. Онош биш, төлбөргүй. Зурагтай стайл, төлбөртэй тайлан энэ урсгалд хаалттай. Баталгаажсан статус өгөхгүй.";
  }
  return "Стайл студи асуулгын нийлбэрээр биш, өнгө, силуэт, тухын сонголтоор чиглэл эрэмбэлнэ.";
}

export function scoreSpan(questions: { options: { score: number }[] }[]) {
  let min = 0;
  let max = 0;
  for (const question of questions) {
    if (question.options.length === 0) continue;
    const scores = question.options.map((option) => option.score);
    min += Math.min(...scores);
    max += Math.max(...scores);
  }
  return { min, max };
}

export function bandIssues(bands: { min: number; max: number }[], span: { min: number; max: number }) {
  const issues: string[] = [];
  if (bands.length === 0) {
    issues.push("Дор хаяж нэг үр дүнгийн муж хэрэгтэй.");
    return issues;
  }
  const sorted = [...bands].sort((a, b) => a.min - b.min || a.max - b.max);
  if (sorted[0].min !== span.min) issues.push(`Эхний муж ${span.min}-оос эхлэх ёстой.`);
  if (sorted.at(-1)!.max !== span.max) issues.push(`Сүүлийн муж ${span.max}-д дуусах ёстой.`);
  for (let index = 0; index < sorted.length; index += 1) {
    if (!Number.isInteger(sorted[index].min) || !Number.isInteger(sorted[index].max)) {
      issues.push("Мужийн хязгаар бүхэл тоо байна.");
    }
    if (sorted[index].min > sorted[index].max) issues.push("Мужийн доод хязгаар дээдээс их байна.");
    if (index > 0 && sorted[index].min !== sorted[index - 1].max + 1) {
      issues.push("Мужууд давхцаж эсвэл завсартай байна.");
    }
  }
  return [...new Set(issues)];
}

export function blankDraft(): TestDraft {
  const span = { min: 0, max: 1 };
  return {
    test: {
      id: "custom-new",
      slug: "",
      kind: "personality",
      activeVersionId: "new-v1",
      priceMnt: PRICES.personality_report,
      productCode: "personality_report",
    },
    version: {
      id: "new-v1",
      testId: "custom-new",
      version: 1,
      status: "demo",
      locale: "mn",
      translationReview: "none",
      licenseRef: null,
      title: "",
      description: "",
      minutes: 5,
      minAge: 18,
      maxAge: null,
      kind: "personality",
      disclaimer: "Энэ үр дүн онош биш.",
      questions: [
        {
          id: "q1",
          text: "",
          options: [
            { id: "a", label: "", score: 0 },
            { id: "b", label: "", score: 1 },
          ],
        },
      ],
      bands: [
        {
          id: "result",
          min: span.min,
          max: span.max,
          title: "",
          summary: "",
          detail: [""],
          paidOutline: ["Тайлбар", "Давуу тал", "Анзаарах хэв маяг", "Өдөр тутмын жишээ"],
        },
      ],
    },
    rule: defaultRule("personality"),
    method: defaultMethod(),
    hidden: true,
    updatedAt: "",
  };
}

export function catalogFromLibrary(library: AdminLibrary): CatalogTest[] {
  const saved = new Map(library.tests.map((item) => [item.version.id, item]));
  const rows: CatalogTest[] = [];
  for (const version of VERSIONS) {
    const test = TESTS.find((item) => item.activeVersionId === version.id);
    if (!test) continue;
    const draft = saved.get(version.id);
    rows.push(asCatalog(draft ?? builtinDraft(test, version), true));
  }
  for (const draft of library.tests) {
    if (VERSIONS.some((version) => version.id === draft.version.id)) continue;
    rows.push(asCatalog(draft, false));
  }
  return rows;
}

export function sanitizeDraft(raw: unknown, catalog: CatalogTest[]): { draft: TestDraft } | { issues: string[] } {
  const body = asRecord(raw);
  const versionRaw = asRecord(body.version);
  const testRaw = asRecord(body.test);
  const builtin = VERSIONS.find((item) => item.id === str(versionRaw.id, 80));
  const original = builtin ? TESTS.find((item) => item.activeVersionId === builtin.id) : undefined;
  const kind = (original?.kind ?? str(versionRaw.kind, 20)) as TestKind;
  const issues: string[] = [];
  if (!QUIZ_KINDS.includes(kind)) issues.push("Асуулгын төрөл буруу байна.");

  const slug = original?.slug ?? str(testRaw.slug, 48).toLowerCase();
  if (!SLUG.test(slug)) issues.push("Холбоос жижиг үсэг, тоо, зураасаар байна.");

  const incomingId = str(versionRaw.id, 80);
  const existingCustom = catalog.find((item) => !item.builtin && item.version.id === incomingId);
  const versionId = original ? original.activeVersionId : existingCustom ? existingCustom.version.id : `${slug}-v1`;
  const testId = original ? original.id : existingCustom ? existingCustom.test.id : `custom-${slug}`;
  if (!original && VERSIONS.some((item) => item.id === versionId || item.testId === testId)) {
    issues.push("Энэ холбоос системийн тесттэй давхцаж байна.");
  }
  if (catalog.some((item) => item.test.slug === slug && item.version.id !== versionId)) {
    issues.push("Ийм холбоостой тест аль хэдийн байна.");
  }

  const title = str(versionRaw.title, 120);
  const description = str(versionRaw.description, 600);
  const disclaimer = str(versionRaw.disclaimer, 400);
  const rule = str(body.rule, 800);
  const method = str(body.method, 1200);
  if (title.length < 2) issues.push("Гарчиг хэрэгтэй.");
  if (description.length < 8) issues.push("Тайлбар хэрэгтэй.");
  if (disclaimer.length < 4) issues.push("Анхааруулга хэрэгтэй.");
  if (rule.length < 12) issues.push("Дүрмийн тайлбар хэрэгтэй.");
  if (method.length < 12) issues.push("Бодох аргачлалын тайлбар хэрэгтэй.");

  const minutes = clampInt(versionRaw.minutes, 1, 60, 5);
  const minAge = kind === "youth" ? 0 : clampInt(versionRaw.minAge, 0, 120, kind === "fun" ? 0 : 18);
  const maxAgeRaw = versionRaw.maxAge;
  const maxAge = kind === "youth" ? 17 : maxAgeRaw == null || maxAgeRaw === "" ? null : clampInt(maxAgeRaw, minAge, 120, minAge);
  const questions = sanitizeQuestions(versionRaw.questions, issues);
  const span = scoreSpan(questions);
  const bands = sanitizeBands(versionRaw.bands, kind, issues);
  issues.push(...bandIssues(bands, span));

  const status = STATUSES.includes(versionRaw.status as VersionStatus) ? (versionRaw.status as VersionStatus) : "demo";
  const translationReview = versionRaw.translationReview === "reviewed" ? "reviewed" : "none";
  const licenseRef = str(versionRaw.licenseRef, 120) || null;
  if (status === "approved" && kind === "youth") issues.push("18-аас доош тестийг баталгаажуулахгүй.");
  if (status === "approved" && (!licenseRef || translationReview !== "reviewed")) {
    issues.push("Баталгаажуулахад лицензийн дугаар, орчуулгын хяналт хэрэгтэй.");
  }

  const priceMnt = kind === "personality" ? clampInt(testRaw.priceMnt, 0, 5_000_000, PRICES.personality_report) : 0;
  const productCode: ProductCode | null = kind === "personality" && priceMnt > 0 ? "personality_report" : null;

  if (issues.length) return { issues: [...new Set(issues)] };

  const draft: TestDraft = {
    test: { id: testId, slug, kind, activeVersionId: versionId, priceMnt, productCode },
    version: {
      id: versionId,
      testId,
      version: builtin?.version ?? 1,
      status,
      locale: "mn",
      translationReview,
      licenseRef,
      title,
      description,
      minutes,
      minAge,
      maxAge,
      kind,
      disclaimer,
      questions,
      bands,
    },
    rule,
    method,
    hidden: body.hidden === true,
    updatedAt: "",
  };
  return { draft };
}

export function sanitizeNews(raw: unknown): { posts: NewsPost[] } | { issues: string[] } {
  if (!Array.isArray(raw)) return { issues: ["Мэдээний жагсаалт буруу байна."] };
  if (raw.length > 40) return { issues: ["Мэдээ 40-өөс хэтрэхгүй."] };
  const issues: string[] = [];
  const posts: NewsPost[] = [];
  const slugs = new Set<string>();
  for (const item of raw) {
    const body = asRecord(item);
    const slug = str(body.slug, 64).toLowerCase();
    const title = str(body.title, 140);
    const excerpt = str(body.excerpt, 280);
    const topic = str(body.topic, 40);
    const publishedOn = str(body.publishedOn, 10);
    const swatch = SWATCHES.includes(body.swatch as NewsSwatch) ? (body.swatch as NewsSwatch) : "personality";
    const paragraphs = Array.isArray(body.body) ? body.body.map((part) => str(part, 1200)).filter(Boolean).slice(0, 12) : [];
    if (!SLUG.test(slug)) issues.push("Мэдээний холбоос буруу байна.");
    if (slugs.has(slug)) issues.push("Мэдээний холбоос давхардсан.");
    slugs.add(slug);
    if (title.length < 2) issues.push("Мэдээний гарчиг хэрэгтэй.");
    if (excerpt.length < 8) issues.push("Мэдээний товч хэрэгтэй.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedOn)) issues.push("Огноо YYYY-MM-DD байна.");
    if (paragraphs.length === 0) issues.push("Мэдээний текст хэрэгтэй.");
    posts.push({ slug, title, publishedOn, topic: topic || "Мэдээ", swatch, excerpt, body: paragraphs });
  }
  if (issues.length) return { issues: [...new Set(issues)] };
  return { posts };
}

function builtinDraft(test: TestDefinition, version: MethodologyVersion): TestDraft {
  return {
    test: { ...test },
    version: structuredClone(version),
    rule: defaultRule(version.kind),
    method: defaultMethod(),
    hidden: false,
    updatedAt: "",
  };
}

function asCatalog(draft: TestDraft, builtin: boolean): CatalogTest {
  const span = scoreSpan(draft.version.questions);
  return { ...draft, builtin, span, issues: bandIssues(draft.version.bands, span) };
}

function sanitizeQuestions(raw: unknown, issues: string[]): Question[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    issues.push("Дор хаяж нэг асуулт хэрэгтэй.");
    return [];
  }
  if (raw.length > 40) issues.push("Асуулт 40-өөс хэтрэхгүй.");
  const ids = new Set<string>();
  return raw.slice(0, 40).map((item, index) => {
    const body = asRecord(item);
    const id = str(body.id, 48) || `q${index + 1}`;
    if (!TOKEN.test(id)) issues.push("Асуултын дугаар буруу байна.");
    if (ids.has(id)) issues.push("Асуултын дугаар давхардсан.");
    ids.add(id);
    const text = str(body.text, 240);
    if (text.length < 2) issues.push("Асуултын текст хэрэгтэй.");
    const options = sanitizeOptions(body.options, issues);
    return { id, text, options };
  });
}

function sanitizeOptions(raw: unknown, issues: string[]) {
  if (!Array.isArray(raw) || raw.length < 2) {
    issues.push("Асуулт бүр дор хаяж хоёр сонголттой.");
    return [];
  }
  if (raw.length > 8) issues.push("Сонголт 8-аас хэтрэхгүй.");
  const ids = new Set<string>();
  return raw.slice(0, 8).map((item, index) => {
    const body = asRecord(item);
    const id = str(body.id, 48) || String.fromCharCode(97 + index);
    if (!TOKEN.test(id)) issues.push("Сонголтын дугаар буруу байна.");
    if (ids.has(id)) issues.push("Сонголтын дугаар давхардсан.");
    ids.add(id);
    const label = str(body.label, 160);
    if (!label) issues.push("Сонголтын текст хэрэгтэй.");
    const score = clampInt(body.score, -20, 20, 0);
    return { id, label, score };
  });
}

function sanitizeBands(raw: unknown, kind: TestKind, issues: string[]): ResultBand[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 12).map((item, index) => {
    const body = asRecord(item);
    const title = str(body.title, 80);
    const summary = str(body.summary, 280);
    if (title.length < 2) issues.push("Үр дүнгийн гарчиг хэрэгтэй.");
    if (summary.length < 4) issues.push("Үр дүнгийн товч хэрэгтэй.");
    const detail = Array.isArray(body.detail) ? body.detail.map((part) => str(part, 280)).filter(Boolean).slice(0, 6) : [];
    const paidOutline =
      kind === "personality"
        ? (Array.isArray(body.paidOutline) ? body.paidOutline.map((part) => str(part, 80)).filter(Boolean).slice(0, 4) : [])
        : [];
    if (kind === "personality" && paidOutline.length !== 4) issues.push("Зан төлөвийн төлбөртэй тайлан 4 гарчигтай.");
    return {
      id: TOKEN.test(str(body.id, 48)) ? str(body.id, 48) : `band${index + 1}`,
      min: clampInt(body.min, -500, 500, 0),
      max: clampInt(body.max, -500, 500, 0),
      title,
      summary,
      detail: detail.length ? detail : [summary],
      paidOutline,
    };
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function str(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isInteger(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}
