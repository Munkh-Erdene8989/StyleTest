import { saveStyleInput } from "@/server/session-service";
import { readJson, withUser } from "@/server/http";
import type { StyleInput } from "@/domain/types";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withUser(req, async (user) => {
    const body = (await readJson(req)) as Partial<StyleInput>;
    const session = await saveStyleInput(user, id, body);
    return Response.json({ id: session.id });
  });
}
