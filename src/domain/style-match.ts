import type { StyleDirection, StyleExample } from "./types";

export const MIN_DIRECTION_SCORE = 2;

export type StyleRankInput = {
  directions: StyleDirection[];
  examples: StyleExample[];
  likedIds: string[];
  aspireIds: string[];
  dislikedIds: string[];
  lifestyle: "office" | "home" | "mixed";
  delivered: StyleDirection[];
  limit: number;
};

export function rankDirections(input: StyleRankInput): StyleDirection[] {
  return rankedDirections(input)
    .filter((item) => item.score >= MIN_DIRECTION_SCORE)
    .slice(0, input.limit)
    .map((item) => item.direction);
}

/** Fills up to `limit` from the next-best directions when fewer than that clear the score floor. */
export function pickDirections(input: StyleRankInput): StyleDirection[] {
  const ranked = rankedDirections(input);
  const chosen = ranked.filter((item) => item.score >= MIN_DIRECTION_SCORE).slice(0, input.limit);
  for (const item of ranked) {
    if (chosen.length >= input.limit) break;
    if (chosen.some((picked) => picked.direction.id === item.direction.id)) continue;
    chosen.push(item);
  }
  return chosen.map((item) => item.direction);
}

function rankedDirections(input: StyleRankInput) {
  const byId = new Map(input.examples.map((item) => [item.id, item]));
  return input.directions
    .map((direction) => ({
      direction,
      score: scoreDirection(direction, byId, input),
    }))
    .filter((item) => !isBlocked(item.direction, input.delivered))
    .sort((a, b) => b.score - a.score || a.direction.id.localeCompare(b.direction.id));
}

export function nextAddonDirection(
  input: Omit<StyleRankInput, "limit" | "delivered"> & { delivered: StyleDirection[] },
) {
  return rankDirections({ ...input, limit: 1 })[0] ?? null;
}

export function isNearDuplicate(a: StyleDirection, b: StyleDirection) {
  return (
    a.id === b.id ||
    (a.paletteFamily === b.paletteFamily &&
      a.silhouette === b.silhouette &&
      a.formality === b.formality)
  );
}

function isBlocked(direction: StyleDirection, delivered: StyleDirection[]) {
  return delivered.some((item) => isNearDuplicate(direction, item));
}

function scoreDirection(
  direction: StyleDirection,
  examples: Map<string, StyleExample>,
  input: StyleRankInput,
) {
  let score = 0;
  for (const id of input.likedIds) {
    const example = examples.get(id);
    if (example) score += matchWeight(direction, example, 3, 2, 2, 1);
  }
  for (const id of input.aspireIds) {
    const example = examples.get(id);
    if (example) score += matchWeight(direction, example, 1, 1, 1, 0);
  }
  for (const id of input.dislikedIds) {
    const example = examples.get(id);
    if (example) score -= matchWeight(direction, example, 8, 6, 6, 0);
  }
  if (input.lifestyle === "office" && direction.formality === "smart") score += 2;
  if (input.lifestyle === "home" && direction.formality === "casual" && direction.silhouette === "relaxed") {
    score += 2;
  }
  return score;
}

function matchWeight(
  direction: StyleDirection,
  example: StyleExample,
  palette: number,
  silhouette: number,
  formality: number,
  pattern: number,
) {
  let score = 0;
  if (direction.paletteFamily === example.paletteFamily) score += palette;
  if (direction.silhouette === example.silhouette) score += silhouette;
  if (direction.formality === example.formality) score += formality;
  if (pattern && direction.patternDensity === example.patternDensity) score += pattern;
  return score;
}
