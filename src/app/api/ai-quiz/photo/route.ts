import { saveQuizPhoto } from "@/server/ai-quiz-service";
import { errorResponse, withGuest } from "@/server/http";
import { AppError } from "@/domain/errors";

export async function POST(req: Request) {
  return withGuest(req, async (user) => {
    try {
      const form = await req.formData();
      const file = form.get("file");
      const role = String(form.get("role") ?? "");
      const consent = String(form.get("consent") ?? "") === "true";
      if (!(file instanceof File)) throw new AppError("invalid_image", 400);
      const bytes = Buffer.from(await file.arrayBuffer());
      const photo = await saveQuizPhoto(user, { role, bytes, contentType: file.type, consent });
      return Response.json(photo);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
