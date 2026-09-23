import { AppError } from "@/domain/errors";
import { saveStyleUpload } from "@/server/session-service";
import { errorResponse, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    try {
      const form = await req.formData();
      const file = form.get("file");
      const role = String(form.get("role") ?? "");
      const sessionId = String(form.get("sessionId") ?? "");
      const consent = String(form.get("consent") ?? "") === "true";
      if (!(file instanceof File)) throw new AppError("invalid_image", 400);
      if (role !== "face" && role !== "body") throw new AppError("invalid_image", 400);
      const bytes = Buffer.from(await file.arrayBuffer());
      const upload = await saveStyleUpload(user, sessionId, role, bytes, file.type, consent);
      return Response.json({ id: upload.id, role: upload.role });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
