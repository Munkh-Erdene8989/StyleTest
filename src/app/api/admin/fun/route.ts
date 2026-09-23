import { updateFunCopy } from "@/server/admin-service";
import { readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    const copy = await updateFunCopy(user, String(body.bandId ?? ""), String(body.title ?? ""), String(body.summary ?? ""));
    return Response.json(copy);
  });
}
