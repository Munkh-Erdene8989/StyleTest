import type { BodyFigure, Gender } from "./types";

export const GENDERS: { id: Gender; label: string }[] = [
  { id: "female", label: "Эмэгтэй" },
  { id: "male", label: "Эрэгтэй" },
  { id: "other", label: "Бусад" },
];

export const BODY_FIGURES: { id: BodyFigure; label: string }[] = [
  { id: "apple", label: "Apple" },
  { id: "banana", label: "Banana" },
  { id: "pear", label: "Pear" },
  { id: "hourglass", label: "Hourglass" },
];

const FIGURE_FROM_SHAPE: Record<string, BodyFigure> = {
  apple: "apple",
  pear: "pear",
  hourglass: "hourglass",
  rectangle: "banana",
};

export function figureFromBodyShape(id: string): BodyFigure | null {
  return FIGURE_FROM_SHAPE[id] ?? null;
}

export function effectiveFigure(manual: BodyFigure | null | undefined, manualSet: boolean | undefined, suggested: BodyFigure | null) {
  if (manualSet) return manual ?? null;
  return suggested;
}

export function nextFigureState(chosen: BodyFigure | null, suggested: BodyFigure | null) {
  if (!chosen || chosen === suggested) return { bodyFigure: null, bodyFigureSet: false };
  return { bodyFigure: chosen, bodyFigureSet: true };
}

export function parseGender(raw: string): Gender | null {
  if (!raw.trim()) return null;
  const match = GENDERS.find((item) => item.id === raw);
  return match ? match.id : null;
}

export function parseBodyFigure(raw: string): BodyFigure | null {
  if (!raw.trim()) return null;
  const match = BODY_FIGURES.find((item) => item.id === raw);
  return match ? match.id : null;
}

export function parsePhone(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[\s()-]/g, "");
  const local = digits.replace(/^\+?976/, "");
  if (!/^\d{8}$/.test(local)) return undefined;
  return local;
}

export function yearMonth(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  if (!year || !month) return null;
  return { year, month, label: `${year} оны ${month}-р сар` };
}
