import { AppError } from "@/domain/errors";
import { applyCallback } from "@/server/order-service";
import { applyStyleQuizCallback } from "@/server/style-quiz-service";
import { errorResponse, readJson } from "@/server/http";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const invoice = new URL(req.url).searchParams.get("invoice_id") ?? undefined;
    try {
      const result = await applyCallback(body, invoice);
      return Response.json(result);
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== "not_found") throw error;
      const result = await applyStyleQuizCallback(body, invoice);
      return Response.json(result);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
