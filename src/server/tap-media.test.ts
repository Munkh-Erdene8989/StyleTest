import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AppError } from "@/domain/errors";
import { prepareTapPhoto, prepareTapVideo } from "./tap-media";
import { frameMarks, parseFfmpegDuration, videoTooLong } from "./video-frames";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

describe("tap media conversion", () => {
  it("turns any readable raster into jpeg", async () => {
    const gif = await sharp(PNG).gif().toBuffer();
    const jpeg = await prepareTapPhoto(gif);
    expect(jpeg.bytes[0]).toBe(0xff);
    expect(jpeg.bytes[1]).toBe(0xd8);
    expect(jpeg.contentType).toBe("image/jpeg");
  });

  it("rejects a file that is not an image", async () => {
    await expect(prepareTapPhoto(Buffer.from("<html><body>no</body></html>"))).rejects.toBeInstanceOf(AppError);
    await expect(prepareTapPhoto(Buffer.from("<html><body>no</body></html>"))).rejects.toMatchObject({ code: "invalid_image" });
  });

  it("rejects a video that does not yield three frames", async () => {
    const mp4 = Buffer.alloc(32, 1);
    await expect(prepareTapVideo(Buffer.from("not-video"), async () => ({ frames: [PNG, PNG], mp4 }))).rejects.toMatchObject({ code: "video_convert_failed" });
  });

  it("reads three converted frames and keeps the mp4 from any container", async () => {
    const mp4 = Buffer.concat([Buffer.from("ftyp"), Buffer.alloc(28, 2)]);
    const prepared = await prepareTapVideo(Buffer.from("container-bytes-with-no-extension"), async () => ({ frames: [PNG, PNG, PNG], mp4 }));
    expect(prepared.frames).toHaveLength(3);
    expect(prepared.frames.every((frame) => frame.bytes[0] === 0xff && frame.bytes[1] === 0xd8)).toBe(true);
    expect(prepared.mp4).toBe(mp4);
  });

  it("places frames at 20, 50 and 80 percent", () => {
    expect(frameMarks(10).map((value) => Number(value.toFixed(2)))).toEqual([2, 5, 8]);
    expect(parseFfmpegDuration("Duration: 00:00:05.20, start")).toBeCloseTo(5.2);
    expect(parseFfmpegDuration("no duration")).toBeNull();
    expect(videoTooLong(15)).toBe(false);
    expect(videoTooLong(15.01)).toBe(true);
  });
});
