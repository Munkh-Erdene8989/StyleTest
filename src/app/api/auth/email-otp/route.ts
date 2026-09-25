import { requestEmailOtp } from "@/server/auth";
import { errorResponse, readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    try {
      const body = await readJson(req);
      const result = await requestEmailOtp(user.id, String(body.email ?? ""));
      return Response.json(result);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
