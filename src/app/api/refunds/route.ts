import { requestRefund } from "@/server/order-service";
import { readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    const refund = await requestRefund(user, String(body.orderId ?? ""), String(body.reason ?? ""));
    return Response.json(refund);
  });
}
