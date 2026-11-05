import { AppError } from "@/domain/errors";
import { errorResponse, withGuest } from "@/server/http";
import { replaceTapMedia } from "@/server/tap-service";

export const maxDuration = 800;
export const runtime = "nodejs";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  return withGuest(req, async (user) => {
    try {
      const { id } = await context.params;
      const form = await req.formData();
      const photo = form.get("photo");
      const video = form.get("video");
      const consent = String(form.get("consent") ?? "") === "true";
      if (!(photo instanceof File) || !(video instanceof File)) throw new AppError("invalid_image", 400);
      const tap = await replaceTapMedia(user, id, {
        photo: Buffer.from(await photo.arrayBuffer()),
        video: Buffer.from(await video.arrayBuffer()),
        consent,
      });
      return Response.json(tap);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
