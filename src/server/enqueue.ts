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
  if (process.env.NODE_ENV === "production") return;
  const { processJobById } = await import("./worker");
  void processJobById(jobId);
}
