import { retryJob } from "@/server/admin-service";
import { readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    return Response.json(await retryJob(user, String(body.jobId ?? "")));
  });
}
