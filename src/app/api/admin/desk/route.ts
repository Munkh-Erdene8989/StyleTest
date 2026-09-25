import { adminDesk } from "@/server/admin-service";
import { withUser } from "@/server/http";

export async function GET(req: Request) {
  return withUser(req, (user) => adminDesk(user).then((data) => Response.json(data)));
}
