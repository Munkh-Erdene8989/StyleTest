import { simulateOrder } from "@/server/order-service";
import { withUser } from "@/server/http";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withUser(req, (user) => simulateOrder(user, id).then((result) => Response.json(result)));
}
