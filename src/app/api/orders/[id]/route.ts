import { AppError } from "@/domain/errors";
import { publicOrder } from "@/server/order-service";
import { getStore } from "@/server/store";
import { withUser } from "@/server/http";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withUser(req, async (user) => {
    const order = await getStore().getOrder(id);
    if (!order || order.ownerUid !== user.id) throw new AppError("not_found", 404);
    return Response.json(publicOrder(order));
  });
}
