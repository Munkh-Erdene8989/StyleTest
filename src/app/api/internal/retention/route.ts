import { runRetention } from "@/server/account-service";

export async function POST(req: Request) {
  const secret = process.env.WORKER_SECRET;
  if (!secret || req.headers.get("x-worker-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const plan = await runRetention();
  return Response.json({
    sessions: plan.sessionIds.length,
    reports: plan.reportIds.length,
    uploads: plan.uploadIds.length,
  });
}
