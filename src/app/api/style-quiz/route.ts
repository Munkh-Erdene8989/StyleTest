import { createStyleQuizCheckout } from "@/server/style-quiz-service";
import { errorResponse, readJson } from "@/server/http";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const quiz = await createStyleQuizCheckout({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      answers: body.answers,
    });
    return Response.json(quiz);
  } catch (error) {
    return errorResponse(error);
  }
}
