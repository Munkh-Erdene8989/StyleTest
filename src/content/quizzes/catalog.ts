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
    title: "Нүүрний хэлбэр",
    description: "32 асуултаар нүүрний хэлбэр, өнгө, ялгарал, нүүрний төрхийг тодорхойлно. Төлсний дараа бүрэн тайлан цахим шуудангаар очно.",
    minutes: "5–8",
  },
  {
    kind: "body_shape",
    slug: "body",
    title: "Биеийн хэлбэр",
    description: "Биеийн харьцаа, хувцас хэрхэн суух, хэр тухтай байхыг харж, биеийн хэлбэрийн тайлан гаргана.",
    minutes: "6–10",
  },
  {
    kind: "archetype",
    slug: "archetype",
    title: "Өөрийгөө таних ба хувийн хэв маяг",
    description: "10 үзүүлэлтийн оноо. Төлсний дараа 25 хуудастай хувийн хэв маягийн тайлан.",
    minutes: "8–12",
  },
];

export function quizBySlug(slug: string) {
  return AI_QUIZ_CATALOG.find((item) => item.slug === slug) ?? null;
}

export function quizByKind(kind: AiQuizKind) {
  return AI_QUIZ_CATALOG.find((item) => item.kind === kind) ?? null;
}
