import { saveQuizAnswers } from "@/server/session-service";
import { readJson, withUser } from "@/server/http";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withUser(req, async (user) => {
    const body = await readJson(req);
    const answers = (body.answers ?? {}) as Record<string, string>;
    const session = await saveQuizAnswers(user, id, answers);
    return Response.json({ id: session.id, answers: session.answers });
  });
}
