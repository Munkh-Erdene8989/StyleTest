import type { ProductCode } from "./types";

const LIST_PRICES: Record<ProductCode, number> = {
  personality_report: 9900,
  style_package: 19000,
  style_addon: 1000,
};

// Temporary checkout discount. 0.01 charges 99% less than list (another 90% off the previous 0.1 prices). Set to 1 to restore list prices.
const TEMP_PRICE_FACTOR = 0.01;

export const PRICES: Record<ProductCode, number> = {
  personality_report: Math.round(LIST_PRICES.personality_report * TEMP_PRICE_FACTOR),
  style_package: Math.round(LIST_PRICES.style_package * TEMP_PRICE_FACTOR),
  style_addon: Math.round(LIST_PRICES.style_addon * TEMP_PRICE_FACTOR),
};

export const STYLE_QUIZ_PRICE_MNT = 150;
export const QUIZ_PRICE_MIN_MNT = 100;
export const QUIZ_PRICE_MAX_MNT = 5_000_000;
export const QUIZ_PRICE_MIN_MESSAGE = "0 дүн оруулж болохгүй. Хамгийн багадаа 100₮ оруулна.";
export const QUIZ_PRICE_RANGE_MESSAGE = "Үнэ 100–5,000,000₮ хооронд бүхэл тоо байна.";

export function quizPriceError(value: unknown) {
  if (value === undefined || value === null || (typeof value === "string" && !value.trim())) return QUIZ_PRICE_MIN_MESSAGE;
  const number = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(number) || number < QUIZ_PRICE_MIN_MNT) return QUIZ_PRICE_MIN_MESSAGE;
  if (!Number.isInteger(number) || number > QUIZ_PRICE_MAX_MNT) return QUIZ_PRICE_RANGE_MESSAGE;
  return null;
}

export function parseQuizPrice(value: unknown) {
  if (quizPriceError(value)) return null;
  return typeof value === "number" ? value : Number(String(value).trim());
}

export function storedQuizPrice(value: unknown) {
  return parseQuizPrice(value) ?? STYLE_QUIZ_PRICE_MNT;
}

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
