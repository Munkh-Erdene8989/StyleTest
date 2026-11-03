import { cookies } from "next/headers";
import { createAiQuizCheckout } from "@/server/ai-quiz-service";
import { userSessionCookie } from "@/server/auth";
import { errorResponse, readJson, withGuest } from "@/server/http";

export async function POST(req: Request) {
  return withGuest(req, async (user) => {
    try {
      const body = await readJson(req);
      const quiz = await createAiQuizCheckout(user, {
        kind: String(body.kind ?? ""),
        answers: body.answers,
        email: String(body.email ?? ""),
        photoId: body.photoId ? String(body.photoId) : undefined,
      });
      const { accountId, ...publicQuiz } = quiz;
      if (accountId !== user.id) {
        const jar = await cookies();
        jar.set("sa_uid", accountId, userSessionCookie());
      }
      return Response.json(publicQuiz);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
