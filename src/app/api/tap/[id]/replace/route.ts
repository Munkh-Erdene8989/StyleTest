import { AppError } from "@/domain/errors";
import { errorResponse, withGuest } from "@/server/http";
import { replaceTapMedia } from "@/server/tap-service";

export const maxDuration = 800;
export const runtime = "nodejs";

const PHOTO_REQUEST_MAX = 4 * 1024 * 1024;

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  return withGuest(req, async (user) => {
    try {
      const { id } = await context.params;
      const form = await req.formData();
      const photo = form.get("photo");
      const jobId = String(form.get("jobId") ?? "");
      if (!(photo instanceof File)) throw new AppError("invalid_image", 400);
      if (!jobId) throw new AppError("invalid_video", 400);
      if (photo.size > PHOTO_REQUEST_MAX) throw new AppError("file_too_large", 400);
      const tap = await replaceTapMedia(user, id, {
        photo: Buffer.from(await photo.arrayBuffer()),
        jobId,
        consent: String(form.get("consent") ?? "") === "true",
      });
      return Response.json(tap);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
