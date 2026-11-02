import { assertAppCheck, confirmAdminPasswordReset } from "@/server/auth";
import { errorResponse, readJson } from "@/server/http";

export async function POST(req: Request) {
  try {
    await assertAppCheck(req);
    const body = await readJson(req);
    await confirmAdminPasswordReset(String(body.token ?? ""), String(body.password ?? ""));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
