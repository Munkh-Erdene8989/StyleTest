import sharp from "sharp";
import convertHeic from "heic-convert";
import { AppError } from "@/domain/errors";
import { imageFormatOk } from "@/domain/images";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EDGE = 2048;

const DECODE = { failOn: "none" as const, animated: false, limitInputPixels: 24_000_000, pages: 1 };

export async function normalizeUploadedImage(bytes: Buffer, maxBytes = MAX_BYTES) {
  if (bytes.length > maxBytes) throw new AppError("file_too_large", 400);
  if (looksLikeMarkup(bytes)) throw new AppError("invalid_image", 400);
  try {
    const prepared = isHeif(bytes) ? await heifToJpeg(bytes) : bytes;
    const converted = await toJpeg(prepared);
    if (!imageFormatOk(converted, "image/jpeg")) throw new Error("not_image");
    return { bytes: converted, contentType: "image/jpeg" as const };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("invalid_image", 400);
  }
}

async function toJpeg(bytes: Buffer) {
  const meta = await sharp(bytes, DECODE).metadata();
  if (!meta.format || !meta.width || !meta.height || meta.format === "svg") throw new Error("not_image");
  return sharp(bytes, DECODE)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 82 })
    .toBuffer();
}

async function heifToJpeg(bytes: Buffer) {
  const jpeg = await convertHeic({ buffer: bytes, format: "JPEG", quality: 0.82 });
  return Buffer.from(jpeg);
}

function isHeif(bytes: Buffer) {
  const head = bytes.subarray(0, 64).toString("latin1").toLowerCase();
  return /ftyp(heic|heix|hevc|hevx|heim|heis|heif|mif1|msf1|avif)/.test(head);
}

function looksLikeMarkup(bytes: Buffer) {
  const head = bytes.subarray(0, 256).toString("utf8").trimStart().toLowerCase();
  return head.startsWith("<") || head.startsWith("<?xml");
}
