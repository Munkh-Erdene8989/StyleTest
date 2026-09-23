import { sessionResult } from "@/server/result-service";
import { withUser } from "@/server/http";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withUser(req, (user) => sessionResult(user, id).then((result) => Response.json(result)));
}
