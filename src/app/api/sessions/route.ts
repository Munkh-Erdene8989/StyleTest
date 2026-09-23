import { createQuizSession } from "@/server/session-service";
import { readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    const session = await createQuizSession(user, String(body.slug ?? ""));
    return Response.json({ id: session.id, versionId: session.versionId });
  });
}
