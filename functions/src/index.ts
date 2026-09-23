import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { processJobById } from "../../src/server/worker";
import { runRetention } from "../../src/server/account-service";

export const worker = onRequest(async (req, res) => {
  if (!process.env.WORKER_SECRET || req.get("x-worker-secret") !== process.env.WORKER_SECRET) {
    res.status(401).send("unauthorized");
    return;
  }
  const jobId = String(req.body?.jobId ?? "");
  if (!jobId) {
    res.status(400).send("jobId");
    return;
  }
  await processJobById(jobId);
  res.json({ ok: true });
});

export const retention = onSchedule("every 24 hours", async () => {
  await runRetention(new Date());
});
