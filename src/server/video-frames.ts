import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { AppError } from "@/domain/errors";

export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export function frameMarks(durationSeconds: number) {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 1;
  return [0.2, 0.5, 0.8].map((ratio) => Math.min(Math.max(duration * ratio, 0), Math.max(duration - 0.04, 0)));
}

export function parseFfmpegDuration(stderr: string) {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function run(args: string[]) {
  return new Promise<{ code: number; stderr: string }>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    const chunks: Buffer[] = [];
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") reject(new AppError("video_convert_failed", 400));
      else reject(error);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stderr: Buffer.concat(chunks).toString("utf8") }));
  });
}

export async function extractVideoFrames(bytes: Buffer) {
  if (bytes.length > VIDEO_MAX_BYTES) throw new AppError("file_too_large", 400);
  if (bytes.length < 32) throw new AppError("invalid_video", 400);
  const dir = await mkdtemp(path.join(tmpdir(), "tap-video-"));
  const input = path.join(dir, "source.bin");
  try {
    await writeFile(input, bytes);
    const probed = await run(["-hide_banner", "-i", input]);
    const duration = parseFfmpegDuration(probed.stderr);
    if (duration === null) throw new AppError("invalid_video", 400);
    const frames: Buffer[] = [];
    for (const [index, seconds] of frameMarks(duration).entries()) {
      const out = path.join(dir, `frame-${index}.jpg`);
      const shot = await run(["-y", "-ss", seconds.toFixed(3), "-i", input, "-frames:v", "1", "-q:v", "3", out]);
      if (shot.code !== 0) throw new AppError("video_convert_failed", 400);
      const jpeg = await readFile(out);
      if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new AppError("video_convert_failed", 400);
      frames.push(jpeg);
    }
    if (frames.length !== 3) throw new AppError("video_convert_failed", 400);
    return frames;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("video_convert_failed", 400);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
