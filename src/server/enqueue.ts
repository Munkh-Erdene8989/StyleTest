export async function enqueueJob(jobId: string) {
  if (process.env.VITEST || process.env.JOBS_INLINE === "0") return;
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const queue = process.env.CLOUD_TASKS_QUEUE;
  const workerUrl = process.env.WORKER_URL;
  if (project && queue && workerUrl) {
    const { CloudTasksClient } = await import("@google-cloud/tasks");
    const client = new CloudTasksClient();
    const parent = client.queuePath(project, process.env.CLOUD_TASKS_LOCATION || "asia-east1", queue);
    await client.createTask({
      parent,
      task: {
        httpRequest: {
          httpMethod: "POST",
          url: workerUrl,
          headers: {
            "Content-Type": "application/json",
            "x-worker-secret": process.env.WORKER_SECRET || "",
          },
          body: Buffer.from(JSON.stringify({ jobId })).toString("base64"),
        },
      },
    });
    return;
  }
  const run = async () => {
    const { processJobById } = await import("./worker");
    await processJobById(jobId);
  };
  try {
    const { after } = await import("next/server");
    after(() => {
      void run().catch((error) => {
        const message = error instanceof Error ? error.message : "failed";
        console.error("job_failed", jobId, message);
      });
    });
  } catch {
    if (process.env.NODE_ENV !== "production") void run();
  }
}
