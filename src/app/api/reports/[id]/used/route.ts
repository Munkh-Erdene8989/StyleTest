import { markRecommendationUsed } from "@/server/result-service";
import { withUser } from "@/server/http";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withUser(req, (user) => markRecommendationUsed(user, id).then((result) => Response.json(result)));
}
