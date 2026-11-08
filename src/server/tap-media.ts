import { AppError } from "@/domain/errors";
import { normalizeUploadedImage } from "./normalize-image";
import { extractVideoFrames } from "./video-frames";

export type ExtractedTapVideo = { frames: Buffer[]; mp4: Buffer };

export const TAP_PHOTO_MAX_BYTES = 20 * 1024 * 1024;

export async function prepareTapPhoto(bytes: Buffer) {
  return normalizeUploadedImage(bytes, TAP_PHOTO_MAX_BYTES);
}

export async function prepareTapVideo(bytes: Buffer, extract: (bytes: Buffer) => Promise<ExtractedTapVideo> = extractVideoFrames) {
  const extracted = await extract(bytes);
  if (extracted.frames.length !== 3 || extracted.mp4.length < 32) throw new AppError("video_convert_failed", 400);
  try {
    const frames = await Promise.all(extracted.frames.map((frame) => normalizeUploadedImage(frame)));
    return { frames, mp4: extracted.mp4 };
  } catch (error) {
    if (error instanceof AppError && error.code === "file_too_large") throw error;
    throw new AppError("video_convert_failed", 400);
  }
}
