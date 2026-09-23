import { completeStyle } from "@/server/session-service";
import { withUser } from "@/server/http";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withUser(req, (user) => completeStyle(user, id).then((session) => Response.json({ id: session.id })));
}
