import { errorResponse, readJson, withGuest } from "@/server/http";
import { openTapVideo } from "@/server/tap-service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  return withGuest(req, async (user) => {
    try {
      const body = await readJson(req);
      const seconds = body.seconds === null || body.seconds === undefined || body.seconds === "" ? null : Number(body.seconds);
      return Response.json(await openTapVideo(user, seconds));
    } catch (error) {
      return errorResponse(error);
    }
  });
}
