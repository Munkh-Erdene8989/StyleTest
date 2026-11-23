import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/domain/errors";
import { compressedVideoArguments, createCloudConvertUpload, extractCloudConvertVideo, finishCloudConvertUpload } from "./cloudconvert-video";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9, ...Buffer.alloc(40, 7)]);
const mp4 = Buffer.concat([Buffer.alloc(4), Buffer.from("ftyp"), Buffer.alloc(40, 3)]);

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CLOUDCONVERT_API_KEY;
});

describe("compressedVideoArguments", () => {
  it("compresses to h264 and grabs the 20, 50 and 80 percent frames", () => {
    const args = compressedVideoArguments(10);
    expect(args).toContain("-crf 28");
    expect(args).toContain("-an");
    expect(args).toContain("/output/face.mp4");
    expect(args).toContain("-ss 2.000");
    expect(args).toContain("-ss 5.000");
    expect(args).toContain("-ss 8.000");
  });
});

describe("extractCloudConvertVideo", () => {
  it("rejects a clip longer than 15 seconds before encoding", async () => {
    process.env.CLOUDCONVERT_API_KEY = "test-key";
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/jobs") && !url.includes("/jobs/")) return json(waitingJob("probe-1", "https://upload.test/probe"));
      if (url === "https://upload.test/probe") return new Response(null, { status: 201 });
      if (url.endsWith("/jobs/probe-1")) return json(finishedProbe("00:00:20.00"));
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(extractCloudConvertVideo(Buffer.alloc(64, 1))).rejects.toMatchObject({ code: "video_too_long" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("uploads once to probe and once to encode, then returns the mp4 and three frames", async () => {
    process.env.CLOUDCONVERT_API_KEY = "test-key";
    const bodies: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      if (url === "https://api.cloudconvert.com/v2/jobs" && init?.method === "POST") {
        bodies.push(String(init.body));
        const encode = String(init.body).includes("encode-video");
        return json(waitingJob(encode ? "encode-1" : "probe-1", encode ? "https://upload.test/encode" : "https://upload.test/probe"));
      }
      if (url === "https://upload.test/probe" || url === "https://upload.test/encode") {
        expect(init?.headers).toBeUndefined();
        return new Response(null, { status: 201 });
      }
      if (url.endsWith("/jobs/probe-1")) return json(finishedProbe("00:00:04.00"));
      if (url.endsWith("/jobs/encode-1")) return json(finishedEncode());
      if (url === "https://files.test/face.mp4") return new Response(mp4);
      if (url.startsWith("https://files.test/frame-")) return new Response(jpeg);
      throw new Error(`unexpected ${url}`);
    });
    const extracted = await extractCloudConvertVideo(Buffer.alloc(64, 1));
    expect(bodies[1]).toContain("-ss 0.800");
    expect(bodies[1]).toContain("-ss 2.000");
    expect(bodies[1]).toContain("-ss 3.200");
    expect(extracted.mp4.subarray(4, 8).toString("latin1")).toBe("ftyp");
    expect(extracted.frames).toHaveLength(3);
    expect(extracted.frames.every((frame) => frame[0] === 0xff && frame[1] === 0xd8)).toBe(true);
  });

  it("treats an unreadable probe as an invalid video", async () => {
    process.env.CLOUDCONVERT_API_KEY = "test-key";
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.endsWith("/jobs") && !url.includes("/jobs/")) return json(waitingJob("probe-1", "https://upload.test/probe"));
      if (url === "https://upload.test/probe") return new Response(null, { status: 201 });
      if (url.endsWith("/jobs/probe-1")) {
        return json({
          id: "probe-1",
          status: "error",
          tasks: [{ operation: "command", status: "error", code: "OPEN_FAILED", message: "Failed to open the file" }],
        });
      }
      throw new Error(`unexpected ${url}`);
    });
    await expect(extractCloudConvertVideo(Buffer.alloc(64, 1))).rejects.toBeInstanceOf(AppError);
    await expect(extractCloudConvertVideo(Buffer.alloc(64, 1))).rejects.toMatchObject({ code: "invalid_video" });
  });
});

describe("direct CloudConvert upload", () => {
  it("returns an upload form and does not send the video through our server", async () => {
    process.env.CLOUDCONVERT_API_KEY = "test-key";
    const bodies: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      if (url === "https://api.cloudconvert.com/v2/jobs" && init?.method === "POST") {
        bodies.push(String(init.body));
        return json(waitingJob("job-1", "https://upload.test/direct"));
      }
      throw new Error(`unexpected ${url}`);
    });
    const upload = await createCloudConvertUpload(4);
    expect(upload).toMatchObject({ jobId: "job-1", url: "https://upload.test/direct", parameters: { signature: "sig" }, phase: "encode" });
    expect(bodies[0]).toContain("-ss 0.800");
    expect(bodies[0]).not.toContain("export-source");
  });

  it("asks CloudConvert to measure a clip when the browser has no duration", async () => {
    process.env.CLOUDCONVERT_API_KEY = "test-key";
    let body = "";
    vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
      body = String(init?.body);
      return json(waitingJob("probe-9", "https://upload.test/probe"));
    });
    const upload = await createCloudConvertUpload(null);
    expect(upload.phase).toBe("probe");
    expect(body).toContain("export-source");
    expect(body).not.toContain("encode-video");
  });

  it("rejects a known duration over 15 seconds before creating a job", async () => {
    process.env.CLOUDCONVERT_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(createCloudConvertUpload(20)).rejects.toMatchObject({ code: "video_too_long" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("downloads the compressed outputs after the browser upload", async () => {
    process.env.CLOUDCONVERT_API_KEY = "test-key";
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.endsWith("/jobs/encode-1")) return json(finishedEncode());
      if (url === "https://files.test/face.mp4") return new Response(mp4);
      if (url.startsWith("https://files.test/frame-")) return new Response(jpeg);
      throw new Error(`unexpected ${url}`);
    });
    const extracted = await finishCloudConvertUpload("encode-1", "encode");
    expect(extracted.frames).toHaveLength(3);
    expect(extracted.mp4.subarray(4, 8).toString("latin1")).toBe("ftyp");
  });

  it("encodes from CloudConvert's own file after measuring the duration", async () => {
    process.env.CLOUDCONVERT_API_KEY = "test-key";
    const bodies: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      if (url === "https://api.cloudconvert.com/v2/jobs" && init?.method === "POST") {
        bodies.push(String(init.body));
        return json({ id: "encode-2", status: "processing", tasks: [] });
      }
      if (url.endsWith("/jobs/probe-1")) return json(finishedProbe("00:00:04.00", "https://files.test/source.bin"));
      if (url.endsWith("/jobs/encode-2")) return json(finishedEncode());
      if (url === "https://files.test/face.mp4") return new Response(mp4);
      if (url.startsWith("https://files.test/frame-")) return new Response(jpeg);
      throw new Error(`unexpected ${url}`);
    });
    const extracted = await finishCloudConvertUpload("probe-1", "probe");
    expect(bodies[0]).toContain("https://files.test/source.bin");
    expect(bodies[0]).toContain("-ss 0.800");
    expect(extracted.frames).toHaveLength(3);
  });

  it("stops a measured clip that is longer than 15 seconds", async () => {
    process.env.CLOUDCONVERT_API_KEY = "test-key";
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/jobs/probe-1")) return json(finishedProbe("00:00:20.00", "https://files.test/source.bin"));
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(finishCloudConvertUpload("probe-1", "probe")).rejects.toMatchObject({ code: "video_too_long" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

function waitingJob(id: string, uploadUrl: string) {
  return {
    id,
    status: "waiting",
    tasks: [{ operation: "import/upload", result: { form: { url: uploadUrl, parameters: { signature: "sig" } } } }],
  };
}

function finishedProbe(duration: string, source?: string) {
  return {
    id: "probe-1",
    status: "finished",
    tasks: [
      { operation: "command", result: { output: `Duration: ${duration}, start: 0.000000` } },
      ...(source ? [{ operation: "export/url", result: { files: [{ filename: "source.bin", url: source }] } }] : []),
    ],
  };
}

function finishedEncode() {
  return {
    id: "encode-1",
    status: "finished",
    tasks: [
      {
        operation: "export/url",
        result: {
          files: [
            { filename: "face.mp4", url: "https://files.test/face.mp4" },
            { filename: "frame-0.jpg", url: "https://files.test/frame-0.jpg" },
            { filename: "frame-1.jpg", url: "https://files.test/frame-1.jpg" },
            { filename: "frame-2.jpg", url: "https://files.test/frame-2.jpg" },
          ],
        },
      },
    ],
  };
}

function json(data: unknown) {
  return new Response(JSON.stringify({ data }), { status: 200, headers: { "content-type": "application/json" } });
}
