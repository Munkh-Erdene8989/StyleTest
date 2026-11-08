import { spawn } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));
import { AppError } from "@/domain/errors";

export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 15;

export function videoTooLong(durationSeconds: number) {
  return Number.isFinite(durationSeconds) && durationSeconds > VIDEO_MAX_SECONDS;
}

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

const PLAYBACK_FILTER = "scale=w='trunc(min(1280,iw)/2)*2':h=-2,format=yuv420p";

function ffmpegBinary() {
  const override = process.env.FFMPEG_PATH;
  if (override && existsSync(override)) return override;
  try {
    const bundled = (require("@ffmpeg-installer/ffmpeg") as { path?: string }).path ?? "";
    if (bundled && existsSync(bundled)) {
      try {
        chmodSync(bundled, 0o755);
      } catch {
        // The packaged binary is already executable.
      }
      return bundled;
    }
  } catch (error) {
    const message = typeof error === "string" ? error : error instanceof Error ? error.message : "unavailable";
    console.error("ffmpeg_binary_missing", message.slice(0, 180));
  }
  return "ffmpeg";
}

function run(args: string[]) {
  return new Promise<{ code: number; stderr: string }>((resolve, reject) => {
    const child = spawn(ffmpegBinary(), args, { stdio: ["ignore", "ignore", "pipe"] });
    const chunks: Buffer[] = [];
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") reject(failConvert("ffmpeg_missing"));
      else reject(error);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stderr: Buffer.concat(chunks).toString("utf8") }));
  });
}

function failConvert(stderr: string): AppError {
  const detail = stderr
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("frame="))
    .slice(-2)
    .join(" ")
    .slice(0, 220);
  console.error("video_convert_failed", detail || "ffmpeg_failed");
  return new AppError("video_convert_failed", 400);
}

export async function extractVideoFrames(bytes: Buffer) {
  if (bytes.length > VIDEO_MAX_BYTES) throw new AppError("file_too_large", 400);
  if (bytes.length < 32) throw new AppError("invalid_video", 400);
  const dir = await mkdtemp(path.join(tmpdir(), "tap-video-"));
  const input = path.join(dir, "source.bin");
  const mp4Path = path.join(dir, "source.mp4");
  try {
    await writeFile(input, bytes);
    const probed = await run(["-hide_banner", "-i", input]);
    const duration = parseFfmpegDuration(probed.stderr);
    if (duration === null) {
      const detail = probed.stderr
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(-2)
        .join(" ")
        .slice(0, 220);
      console.error("invalid_video", detail || "unreadable");
      throw new AppError("invalid_video", 400);
    }
    if (videoTooLong(duration)) throw new AppError("video_too_long", 400);
    const converted = await run([
      "-y",
      "-fflags",
      "+genpts+discardcorrupt",
      "-i",
      input,
      "-map",
      "0:v:0",
      "-vf",
      PLAYBACK_FILTER,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      mp4Path,
    ]);
    if (converted.code !== 0) throw failConvert(converted.stderr);
    const mp4 = await readFile(mp4Path);
    if (mp4.length < 32) throw failConvert("empty_mp4");
    const frames: Buffer[] = [];
    for (const [index, seconds] of frameMarks(duration).entries()) {
      const out = path.join(dir, `frame-${index}.jpg`);
      const at = seconds.toFixed(3);
      let shot = await run(["-y", "-ss", at, "-i", mp4Path, "-map", "0:v:0", "-frames:v", "1", "-q:v", "3", out]);
      if (shot.code !== 0) shot = await run(["-y", "-i", mp4Path, "-ss", at, "-map", "0:v:0", "-frames:v", "1", "-q:v", "3", out]);
      if (shot.code !== 0) throw failConvert(shot.stderr);
      const jpeg = await readFile(out);
      if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw failConvert("empty_frame");
      frames.push(jpeg);
    }
    if (frames.length !== 3) throw failConvert("missing_frames");
    return { frames, mp4 };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw failConvert(error instanceof Error ? error.message : "ffmpeg_failed");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
