import { AppError } from "@/domain/errors";
import { frameMarks, parseFfmpegDuration, VIDEO_MAX_BYTES, videoTooLong } from "./video-frames";

const API = "https://api.cloudconvert.com/v2";
const FILTER = "scale=1280:-2:force_original_aspect_ratio=decrease:force_divisible_by=2,format=yuv420p";

type CloudFile = { filename?: string; url?: string };
type CloudTask = {
  operation?: string;
  status?: string;
  code?: string | null;
  message?: string | null;
  result?: {
    form?: { url?: string; parameters?: Record<string, string | number> };
    output?: string;
    files?: CloudFile[];
  };
};
type CloudJob = { id: string; status: string; tasks: CloudTask[] };

export function compressedVideoArguments(durationSeconds: number) {
  const frames = frameMarks(durationSeconds)
    .map((seconds, index) => `-ss ${seconds.toFixed(3)} -map 0:v:0 -vf ${FILTER} -frames:v 1 -q:v 3 /output/frame-${index}.jpg`)
    .join(" ");
  return [
    "-y -fflags +genpts+discardcorrupt -i /input/import-video/source.bin",
    `-map 0:v:0 -vf ${FILTER} -c:v libx264 -preset veryfast -crf 28 -pix_fmt yuv420p -movflags +faststart -an /output/face.mp4`,
    frames,
  ].join(" ");
}

export async function extractCloudConvertVideo(bytes: Buffer) {
  if (bytes.length > VIDEO_MAX_BYTES) throw new AppError("file_too_large", 400);
  if (bytes.length < 32) throw new AppError("invalid_video", 400);
  const key = process.env.CLOUDCONVERT_API_KEY ?? "";
  if (!key) fail("video_convert_failed", "cloudconvert_key_missing");
  const duration = await probeDuration(bytes, key);
  if (videoTooLong(duration)) throw new AppError("video_too_long", 400);
  return encodeVideo(bytes, duration, key);
}

async function probeDuration(bytes: Buffer, key: string) {
  const job = await runJob(bytes, key, {
    "import-video": { operation: "import/upload" },
    "probe-video": {
      operation: "command",
      input: "import-video",
      engine: "ffmpeg",
      command: "ffmpeg",
      capture_output: true,
      timeout: 60,
      arguments: "-hide_banner -i /input/import-video/source.bin -map 0:v:0 -frames:v 1 -q:v 8 /output/probe.jpg",
    },
  });
  const duration = parseFfmpegDuration(taskText(job));
  if (job.status === "error" || duration === null) fail("invalid_video", taskText(job) || "unreadable");
  return duration;
}

export async function createCloudConvertUpload(duration: number | null) {
  const key = requireKey();
  if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) fail("invalid_video", "bad_duration");
  if (duration !== null && videoTooLong(duration)) throw new AppError("video_too_long", 400);
  const phase = duration === null ? "probe" : "encode";
  const tasks = duration === null ? probeTasks() : encodeTasks(duration);
  const job = jobFrom(await request(key, "/jobs", { method: "POST", body: JSON.stringify({ tasks }) }));
  const form = uploadForm(job);
  return { jobId: job.id, url: form.url, parameters: form.parameters, phase };
}

export async function finishCloudConvertUpload(jobId: string, phase: "encode" | "probe") {
  const key = requireKey();
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(jobId)) fail("invalid_video", "bad_job");
  const job = await waitJob(jobId, key);
  if (phase === "encode") return outputsFrom(job);
  const duration = parseFfmpegDuration(taskText(job));
  if (job.status === "error" || duration === null) fail("invalid_video", taskText(job) || "unreadable");
  if (videoTooLong(duration)) throw new AppError("video_too_long", 400);
  const created = jobFrom(await request(key, "/jobs", { method: "POST", body: JSON.stringify({ tasks: encodeTasks(duration, sourceFile(job)) }) }));
  return outputsFrom(await waitJob(created.id, key));
}

async function encodeVideo(bytes: Buffer, duration: number, key: string) {
  return outputsFrom(await runJob(bytes, key, encodeTasks(duration)));
}

function encodeTasks(duration: number, sourceUrl?: string) {
  return {
    "import-video": sourceUrl ? { operation: "import/url", url: sourceUrl, filename: "source.bin" } : { operation: "import/upload" },
    "encode-video": {
      operation: "command",
      input: "import-video",
      engine: "ffmpeg",
      command: "ffmpeg",
      capture_output: true,
      timeout: 180,
      arguments: compressedVideoArguments(duration),
    },
    "export-video": { operation: "export/url", input: "encode-video" },
  };
}

function probeTasks() {
  return {
    "import-video": { operation: "import/upload" },
    "probe-video": {
      operation: "command",
      input: "import-video",
      engine: "ffmpeg",
      command: "ffmpeg",
      capture_output: true,
      timeout: 60,
      arguments: "-hide_banner -i /input/import-video/source.bin -map 0:v:0 -frames:v 1 -q:v 8 /output/probe.jpg",
    },
    "export-source": { operation: "export/url", input: "import-video" },
  };
}

function requireKey() {
  const key = process.env.CLOUDCONVERT_API_KEY ?? "";
  if (!key) fail("video_convert_failed", "cloudconvert_key_missing");
  return key;
}

function uploadForm(job: CloudJob) {
  const target = job.tasks.find((task) => task.result?.form?.url)?.result?.form;
  if (!target?.url?.startsWith("https://")) fail("video_convert_failed", "upload_form_missing");
  const parameters: Record<string, string> = {};
  for (const [name, value] of Object.entries(target.parameters ?? {})) parameters[name] = String(value);
  return { url: target.url, parameters };
}

function sourceFile(job: CloudJob) {
  const files = job.tasks.find((task) => task.operation === "export/url")?.result?.files ?? [];
  const file = files.find((item) => item.filename === "source.bin") ?? files[0];
  if (!file?.url?.startsWith("https://")) fail("video_convert_failed", "source_missing");
  return file.url;
}

async function outputsFrom(job: CloudJob) {
  if (job.status !== "finished") fail("video_convert_failed", taskText(job) || "encode_failed");
  const files = job.tasks.find((task) => task.operation === "export/url")?.result?.files ?? [];
  const mp4 = await downloadNamed(files, "face.mp4");
  const frames = await Promise.all([0, 1, 2].map((index) => downloadNamed(files, `frame-${index}.jpg`)));
  if (mp4.length < 32 || mp4.subarray(4, 8).toString("latin1") !== "ftyp") fail("video_convert_failed", "empty_mp4");
  if (frames.some((frame) => frame[0] !== 0xff || frame[1] !== 0xd8)) fail("video_convert_failed", "empty_frame");
  return { frames, mp4 };
}

async function runJob(bytes: Buffer, key: string, tasks: Record<string, unknown>) {
  const created = await request(key, "/jobs", { method: "POST", body: JSON.stringify({ tasks }) });
  const waiting = jobFrom(created);
  await upload(waiting, bytes);
  return waitJob(waiting.id, key);
}

async function upload(job: CloudJob, bytes: Buffer) {
  const formTask = job.tasks.find((task) => task.result?.form?.url);
  const target = formTask?.result?.form;
  if (!target?.url) fail("video_convert_failed", "upload_form_missing");
  const form = new FormData();
  for (const [name, value] of Object.entries(target.parameters ?? {})) form.append(name, String(value));
  form.append("file", new File([new Uint8Array(bytes)], "source.bin", { type: "application/octet-stream" }));
  const response = await fetch(target.url, { method: "POST", body: form, signal: AbortSignal.timeout(120_000) });
  if (!response.ok) fail("video_convert_failed", `upload_http_${response.status}`);
}

async function waitJob(id: string, key: string) {
  const deadline = Date.now() + 180_000;
  for (;;) {
    const job = jobFrom(await request(key, `/jobs/${id}`));
    if (job.status === "finished" || job.status === "error") return job;
    if (Date.now() > deadline) fail("video_convert_failed", "cloudconvert_timeout");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

async function downloadNamed(files: CloudFile[], filename: string) {
  const file = files.find((item) => item.filename === filename);
  if (!file?.url) fail("video_convert_failed", `missing_${filename}`);
  const response = await fetch(file.url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) fail("video_convert_failed", `download_http_${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32) fail("video_convert_failed", `short_${filename}`);
  return bytes;
}

async function request(key: string, path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  if (!response.ok) fail("video_convert_failed", `cloudconvert_http_${response.status} ${text}`);
  try {
    return JSON.parse(text) as { data?: CloudJob };
  } catch {
    fail("video_convert_failed", "cloudconvert_bad_json");
  }
}

function jobFrom(payload: { data?: CloudJob }) {
  const job = payload.data;
  if (!job?.id || !Array.isArray(job.tasks)) fail("video_convert_failed", "cloudconvert_bad_job");
  return job;
}

function taskText(job: CloudJob) {
  return job.tasks
    .flatMap((task) => [task.code, task.message, task.result?.output])
    .filter((item): item is string => Boolean(item))
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 2000);
}

function fail(code: "invalid_video" | "video_convert_failed", detail: string): never {
  console.error(code, detail.replace(/\s+/g, " ").slice(0, 180));
  throw new AppError(code, 400);
}
