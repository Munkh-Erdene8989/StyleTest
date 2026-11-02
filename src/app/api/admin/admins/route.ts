import { addAdmin, removeAdmin } from "@/server/admin-service";
import { adminResetOrigin } from "@/lib/admin-host";
import { errorResponse, readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    try {
      const body = await readJson(req);
      const result = await addAdmin(user, String(body.email ?? ""), adminResetOrigin(req));
      return Response.json(result);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export async function DELETE(req: Request) {
  return withUser(req, async (user) => {
    try {
      const body = await readJson(req);
      await removeAdmin(user, String(body.email ?? ""));
      return Response.json({ ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
