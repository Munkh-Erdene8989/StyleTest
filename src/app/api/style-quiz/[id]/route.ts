import { readStyleQuiz } from "@/server/style-quiz-service";
import { errorResponse } from "@/server/http";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await readStyleQuiz(id));
  } catch (error) {
    return errorResponse(error);
  }
}
