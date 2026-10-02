import type { AiQuizKind } from "@/domain/ai-quiz";

export type AiQuizListing = {
  kind: AiQuizKind;
  slug: string;
  title: string;
  description: string;
  minutes: string;
};

export const AI_QUIZ_CATALOG: AiQuizListing[] = [
  {
    kind: "face_beauty",
    slug: "face",
    title: "Нүүр ба гоо сайхан",
    description: "32 асуултаар нүүрний хэлбэр, өнгө, контраст, essence. Төлсний дараа товч тайлан гарна.",
    minutes: "5–8",
  },
  {
    kind: "body_shape",
    slug: "body",
    title: "Биеийн хэлбэр ба хувцаслалт",
    description: "Харьцаа, хувцасны суулт, тав тух. Үр дүнг биеийн хэлбэрийн тайлан гэж гаргана.",
    minutes: "6–10",
  },
  {
    kind: "archetype",
    slug: "archetype",
    title: "Өөрийгөө таних ба хувийн стиль",
    description: "Хэмжээсүүдийн оноо ба хувийн стилийн чиглэл.",
    minutes: "8–12",
  },
];

export function quizBySlug(slug: string) {
  return AI_QUIZ_CATALOG.find((item) => item.slug === slug) ?? null;
}

export function quizByKind(kind: AiQuizKind) {
  return AI_QUIZ_CATALOG.find((item) => item.kind === kind) ?? null;
}
