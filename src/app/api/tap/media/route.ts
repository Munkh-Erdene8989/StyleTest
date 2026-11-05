import { saveTapMedia } from "@/server/tap-service";
import { errorResponse, withGuest } from "@/server/http";
import { AppError } from "@/domain/errors";

export const maxDuration = 800;
export const runtime = "nodejs";

export async function POST(req: Request) {
  return withGuest(req, async (user) => {
    try {
      const form = await req.formData();
      const photo = form.get("photo");
      const video = form.get("video");
      const consent = String(form.get("consent") ?? "") === "true";
      if (!(photo instanceof File) || !(video instanceof File)) throw new AppError("invalid_image", 400);
      const saved = await saveTapMedia(user, {
        photo: Buffer.from(await photo.arrayBuffer()),
        video: Buffer.from(await video.arrayBuffer()),
        consent,
      });
      return Response.json(saved);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
