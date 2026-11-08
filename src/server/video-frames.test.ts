import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AppError } from "@/domain/errors";
import { extractVideoFrames } from "./video-frames";

const require = createRequire(import.meta.url);
const ffmpeg = (require("@ffmpeg-installer/ffmpeg") as { path: string }).path;

function encode(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}`))));
  });
}

describe("extractVideoFrames", () => {
  it("rejects a file that is not a video", async () => {
    await expect(extractVideoFrames(Buffer.from("this is not a video file at all"))).rejects.toBeInstanceOf(AppError);
    await expect(extractVideoFrames(Buffer.from("this is not a video file at all"))).rejects.toMatchObject({ code: "invalid_video" });
  });

  it("turns a 10-bit HEVC mov into three jpeg frames and an mp4", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "tap-fixture-"));
    const mov = path.join(dir, "clip.mov");
    try {
      await encode([
        "-f",
        "lavfi",
        "-i",
        "testsrc2=size=160x240:rate=10:duration=1",
        "-c:v",
        "libx265",
        "-pix_fmt",
        "yuv420p10le",
        "-tag:v",
        "hvc1",
        "-an",
        mov,
      ]);
      const extracted = await extractVideoFrames(await readFile(mov));
      expect(extracted.frames).toHaveLength(3);
      expect(extracted.frames.every((frame) => frame[0] === 0xff && frame[1] === 0xd8)).toBe(true);
      expect(extracted.mp4.subarray(4, 8).toString("latin1")).toBe("ftyp");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 30000);
});
