import { processJobById } from "@/server/worker";
import { readJson } from "@/server/http";

export async function POST(req: Request) {
  const secret = process.env.WORKER_SECRET;
  if (!secret || req.headers.get("x-worker-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await readJson(req);
  const jobId = String(body.jobId ?? "");
  if (!jobId) return Response.json({ error: "job_id" }, { status: 400 });
  await processJobById(jobId);
  return Response.json({ ok: true });
}
