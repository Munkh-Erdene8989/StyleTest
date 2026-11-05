import { cookies } from "next/headers";
import { createTapCheckout } from "@/server/tap-service";
import { userSessionCookie } from "@/server/auth";
import { errorResponse, readJson, withGuest } from "@/server/http";

export const maxDuration = 60;

export async function POST(req: Request) {
  return withGuest(req, async (user) => {
    try {
      const body = await readJson(req);
      const tap = await createTapCheckout(user, {
        email: String(body.email ?? ""),
        photoId: String(body.photoId ?? ""),
        frameIds: body.frameIds,
        videoPath: String(body.videoPath ?? ""),
        bodyShape: body.bodyShape,
      });
      const { accountId, ...publicTap } = tap;
      if (accountId !== user.id) {
        const jar = await cookies();
        jar.set("sa_uid", accountId, userSessionCookie());
      }
      return Response.json(publicTap);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
