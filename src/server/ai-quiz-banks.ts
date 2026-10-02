import { readFileSync, existsSync } from "fs";
import path from "path";
import { faceQuestions } from "@/content/quizzes/face-beauty";
import rawBody from "@/content/quizzes/body-shape.json";
import type { AiAnswer, AiQuizKind, PublicAiField, PublicAiQuestion } from "@/domain/ai-quiz";
import type { ArchetypeBank, BodyBank } from "@/domain/ai-quiz-score";

const bodyBank = rawBody as unknown as BodyBank;

const ARCHETYPE_FILE = path.join(process.cwd(), "src/content/quizzes/personality_test_MN_v01.json");

export function bodyQuizBank() {
  return bodyBank;
}

export function archetypeAvailable() {
  return loadArchetypeBank() !== null;
}

export function loadArchetypeBank(): ArchetypeBank | null {
  if (!existsSync(ARCHETYPE_FILE)) return null;
  const raw = JSON.parse(readFileSync(ARCHETYPE_FILE, "utf8")) as {
    dimensions?: { id?: string; label?: string; name_mn?: string }[];
    questions?: { id?: string; text?: string; text_mn?: string; dimension?: string; reverse?: boolean }[];
    scale?: Record<string, string>;
  };
  const dimensions = (raw.dimensions ?? []).flatMap((item) => {
    if (!item.id) return [];
    return [{ id: item.id, label: item.name_mn || item.label }];
  });
  const questions = (raw.questions ?? []).flatMap((item) => {
    if (!item.id || !item.dimension) return [];
    return [{ id: item.id, text: item.text_mn || item.text || item.id, dimension: item.dimension, reverse: Boolean(item.reverse) }];
  });
  if (!dimensions.length || !questions.length) return null;
  const scale = raw.scale && typeof raw.scale === "object" ? raw.scale : undefined;
  return { dimensions, questions, scale };
}

export function publicQuestions(kind: AiQuizKind): PublicAiQuestion[] {
  if (kind === "face_beauty") {
    return faceQuestions.map((question) => ({
      id: question.id,
      sectionTitle: question.sectionTitle,
      text: question.text,
      required: true,
      type: "single",
      options: question.options.map((option) => ({ id: option.id, label: option.label })),
    }));
  }
  if (kind === "body_shape") {
    const sections = new Map(bodyBank.sections.map((section) => [section.id, section.title]));
    return bodyBank.questions.map((question) => ({
      id: question.id,
      sectionTitle: sections.get(question.section_id ?? "") || "",
      text: question.title,
      help: question.help,
      required: Boolean(question.required),
      type: publicType(question.type),
      unit: question.unit,
      options: question.options?.map((option) => ({ id: option.id, label: option.label })),
      fields: question.fields?.map(publicField).filter((field): field is PublicAiField => Boolean(field)),
      confirmLabel: question.quality_confirmation?.label,
    }));
  }
  const bank = loadArchetypeBank();
  if (!bank) return [];
  const scale = scaleOptions(bank.scale);
  return bank.questions.map((question) => ({
    id: question.id,
    sectionTitle: bank.dimensions.find((dimension) => dimension.id === question.dimension)?.label || question.dimension,
    text: question.text || question.id,
    required: true,
    type: "single",
    options: scale,
  }));
}

export function normalizeAnswers(kind: AiQuizKind, raw: unknown): { answers: Record<string, AiAnswer>; missing: string[] } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const questions = publicQuestions(kind);
  if (!questions.length) return null;
  const source = raw as Record<string, unknown>;
  const answers: Record<string, AiAnswer> = {};
  const missing: string[] = [];
  for (const question of questions) {
    const parsed = parseAnswer(question, source[question.id]);
    if (!parsed) {
      if (question.required) missing.push(question.id);
      continue;
    }
    answers[question.id] = parsed;
  }
  return { answers, missing };
}

function publicType(type: string): PublicAiQuestion["type"] {
  if (type === "multiple_choice") return "multiple";
  if (type === "number") return "number";
  if (type === "group") return "group";
  return "single";
}

function publicField(field: { id: string; type: string; label?: string }): PublicAiField | null {
  if (field.type !== "boolean" && field.type !== "number" && field.type !== "text" && field.type !== "textarea") return null;
  return { id: field.id, type: field.type, label: field.label || field.id };
}

function scaleOptions(scale?: Record<string, string>) {
  const entries = Object.entries(scale ?? {}).filter(([value]) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5;
  });
  const source = entries.length ? entries : [1, 2, 3, 4, 5].map((value) => [String(value), String(value)] as [string, string]);
  return source.map(([value, label]) => ({ id: value, label }));
}

function parseAnswer(question: PublicAiQuestion, raw: unknown): AiAnswer | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  if (question.type === "single" && row.type === "single") {
    const optionId = clean(row.optionId, 80);
    if (!question.options?.some((option) => option.id === optionId)) return null;
    return { type: "single", optionId };
  }
  if (question.type === "multiple" && row.type === "multiple" && Array.isArray(row.optionIds)) {
    const optionIds = row.optionIds.map((id) => clean(id, 80)).filter((id) => question.options?.some((option) => option.id === id));
    const unique = [...new Set(optionIds)].slice(0, 20);
    return unique.length ? { type: "multiple", optionIds: unique } : null;
  }
  if (question.type === "number" && row.type === "number") {
    const value = row.value === null || row.value === "" ? null : numberValue(row.value);
    if (value === undefined) return null;
    return { type: "number", value, confirmed: row.confirmed === true };
  }
  if (question.type === "group" && row.type === "group" && row.fields && typeof row.fields === "object" && !Array.isArray(row.fields)) {
    const fields: Record<string, string | number | boolean | null> = {};
    for (const field of question.fields ?? []) {
      const value = (row.fields as Record<string, unknown>)[field.id];
      if (value === undefined || value === null || value === "") continue;
      if (field.type === "boolean" && typeof value === "boolean") fields[field.id] = value;
      if (field.type === "number") {
        const parsed = numberValue(value);
        if (parsed !== undefined && parsed !== null) fields[field.id] = parsed;
      }
      if (field.type === "text" || field.type === "textarea") {
        const text = clean(value, field.type === "textarea" ? 1000 : 100);
        if (text) fields[field.id] = text;
      }
    }
    return Object.keys(fields).length ? { type: "group", fields } : null;
  }
  return null;
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function clean(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
