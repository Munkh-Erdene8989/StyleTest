import { requestAdminPasswordReset } from "@/server/auth";
import { adminResetOrigin } from "@/lib/admin-host";
import { errorResponse, readJson, withGuest } from "@/server/http";

export async function POST(req: Request) {
  return withGuest(req, async () => {
    try {
      const body = await readJson(req);
      const result = await requestAdminPasswordReset(String(body.email ?? ""), adminResetOrigin(req));
      return Response.json(result);
    } catch (error) {
      return errorResponse(error);
    }
  });
}
