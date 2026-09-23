import { adminOverview } from "@/server/admin-service";
import { withUser } from "@/server/http";

export async function GET(req: Request) {
  return withUser(req, (user) => adminOverview(user).then((data) => Response.json(data)));
}
