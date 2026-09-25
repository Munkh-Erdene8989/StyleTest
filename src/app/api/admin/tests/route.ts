import { removeTestDraft, saveTestDraft } from "@/server/admin-service";
import { readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    if (body.remove === true) {
      return Response.json(await removeTestDraft(user, String(body.versionId ?? "")));
    }
    return Response.json(await saveTestDraft(user, body.draft));
  });
}
