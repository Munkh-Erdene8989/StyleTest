export const BRAND_NAME = "Naruka Styling Studio";

export const BRAND_DESCRIPTION =
  "Naruka Styling Studio — Улаанбаатар, City Tower дахь мэргэжлийн стайлинг студи. Хувийн өнгө тодорхойлох, нүүр будалт, стайлингийн зөвлөгөө.";

export const BRAND_KEYWORDS = [
  "Naruka Styling Studio",
  "Naruka",
  "Нарука",
  "стайлинг студи",
  "хувийн өнгө",
  "personal color",
  "нүүр будалт",
  "стайлинг",
  "City Tower",
  "Улаанбаатар",
];

export const BRAND_EMAIL = "naruka.stylingstudio@gmail.com";
export const BRAND_PHONE = "+97686106616";
export const BRAND_FACEBOOK = "https://facebook.com/narukastylingstudio";

export const PUBLIC_NOTICE =
  "Тайлан, дүрслэлд хиймэл оюун (AI) ашиглана. Зурагтай стайл, төлбөртэй тайлан насанд хүрэгчдэд зориулагдсан.";

export function resolveAppName(name: string | undefined | null) {
  const trimmed = name?.trim();
  if (!trimmed || trimmed === "StyleAI") return BRAND_NAME;
  return trimmed;
}
