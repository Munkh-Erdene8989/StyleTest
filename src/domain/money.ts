import type { ProductCode } from "./types";

export const PRICES: Record<ProductCode, number> = {
  personality_report: 9900,
  style_package: 19000,
  style_addon: 1000,
};

export function textCostUsd(inputTokens: number, outputTokens: number) {
  const inputRate = numberEnv("OPENAI_INPUT_USD_PER_MTOK", 2);
  const outputRate = numberEnv("OPENAI_OUTPUT_USD_PER_MTOK", 8);
  return (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
}

export function imageCostUsd(imageCount: number, inputTokens: number) {
  const perImage = numberEnv("IMAGE_USD_PER_IMAGE", 0.063);
  const inputRate = numberEnv("IMAGE_INPUT_USD_PER_MTOK", 0.5);
  return imageCount * perImage + (inputTokens / 1_000_000) * inputRate;
}

export function usdToMnt(usd: number) {
  const fx = numberEnv("COST_FX_MNT_PER_USD", 0);
  if (!fx) return null;
  return Math.round(usd * fx);
}

function numberEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}
