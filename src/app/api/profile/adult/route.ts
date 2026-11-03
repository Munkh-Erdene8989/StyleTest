import { assumeAdult } from "@/server/auth";
import { errorResponse, withGuest } from "@/server/http";

export async function POST(req: Request) {
  return withGuest(req, async (user) => {
    try {
      const ready = await assumeAdult(user);
      return Response.json({ ageBand: ready.ageBand });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
