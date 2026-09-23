import { confirmManualRefund, reviewRefund } from "@/server/order-service";
import { canOperate } from "@/server/auth";
import { AppError } from "@/domain/errors";
import { readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    if (!canOperate(user.role)) throw new AppError("forbidden", 403);
    const body = await readJson(req);
    if (body.action === "manual") return Response.json(await confirmManualRefund(user, String(body.refundId ?? "")));
    const decision = body.decision === "reject" ? "reject" : "approve";
    return Response.json(await reviewRefund(user, String(body.refundId ?? ""), decision));
  });
}
