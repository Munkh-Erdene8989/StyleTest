import { AppError } from "@/domain/errors";
import { normalizeUploadedImage } from "./normalize-image";
import { extractVideoFrames } from "./video-frames";

export const TAP_PHOTO_MAX_BYTES = 20 * 1024 * 1024;

export async function prepareTapPhoto(bytes: Buffer) {
  return normalizeUploadedImage(bytes, TAP_PHOTO_MAX_BYTES);
}

export async function prepareTapVideo(bytes: Buffer, extract: (bytes: Buffer) => Promise<Buffer[]> = extractVideoFrames) {
  const frames = await extract(bytes);
  if (frames.length !== 3) throw new AppError("video_convert_failed", 400);
  try {
    return await Promise.all(frames.map((frame) => normalizeUploadedImage(frame)));
  } catch (error) {
    if (error instanceof AppError && error.code === "file_too_large") throw error;
    throw new AppError("video_convert_failed", 400);
  }
}
