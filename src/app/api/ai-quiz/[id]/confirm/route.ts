import { confirmAiQuiz } from "@/server/ai-quiz-service";
import { withGuest } from "@/server/http";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  return withGuest(req, async (user) => {
    const { id } = await context.params;
    return Response.json(await confirmAiQuiz(user, id));
  });
}
