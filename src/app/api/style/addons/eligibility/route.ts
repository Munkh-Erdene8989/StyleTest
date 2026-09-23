import { addonEligibility } from "@/server/order-service";
import { withUser } from "@/server/http";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId") ?? "";
  return withUser(req, (user) => addonEligibility(user, sessionId).then((result) => Response.json(result)));
}
