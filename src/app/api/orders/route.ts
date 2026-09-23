import { createOrder } from "@/server/order-service";
import { readJson, withUser } from "@/server/http";
import type { ProductCode } from "@/domain/types";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    const order = await createOrder(user, {
      sessionId: String(body.sessionId ?? ""),
      productCode: String(body.productCode ?? "") as ProductCode,
      addonDirectionId: body.addonDirectionId ? String(body.addonDirectionId) : undefined,
    });
    return Response.json(order);
  });
}
