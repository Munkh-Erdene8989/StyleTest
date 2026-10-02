import { createAiQuizCheckout } from "@/server/ai-quiz-service";
import { errorResponse, readJson, withGuest } from "@/server/http";

export async function POST(req: Request) {
  return withGuest(req, async (user) => {
    try {
      const body = await readJson(req);
      const quiz = await createAiQuizCheckout(user, {
        kind: String(body.kind ?? ""),
        answers: body.answers,
        email: String(body.email ?? ""),
      });
      return Response.json(quiz);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
