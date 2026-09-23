import { createStyleSession } from "@/server/session-service";
import { withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, (user) => createStyleSession(user).then((session) => Response.json({ id: session.id })));
}
