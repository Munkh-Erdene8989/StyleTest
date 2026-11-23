import { AppError } from "@/domain/errors";
import { errorResponse, withGuest } from "@/server/http";
import { saveTapMedia } from "@/server/tap-service";

export const maxDuration = 800;
export const runtime = "nodejs";

const PHOTO_REQUEST_MAX = 4 * 1024 * 1024;

export async function POST(req: Request) {
  return withGuest(req, async (user) => {
    try {
      const form = await req.formData();
      const photo = form.get("photo");
      const jobId = String(form.get("jobId") ?? "");
      if (!(photo instanceof File)) throw new AppError("invalid_image", 400);
      if (!jobId) throw new AppError("invalid_video", 400);
      if (photo.size > PHOTO_REQUEST_MAX) throw new AppError("file_too_large", 400);
      const saved = await saveTapMedia(user, {
        photo: Buffer.from(await photo.arrayBuffer()),
        jobId,
        consent: String(form.get("consent") ?? "") === "true",
      });
      return Response.json(saved);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
