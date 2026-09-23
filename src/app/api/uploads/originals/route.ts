import { deleteOriginalPhotos } from "@/server/account-service";
import { withUser } from "@/server/http";

export async function DELETE(req: Request) {
  return withUser(req, async (user) => Response.json(await deleteOriginalPhotos(user)));
}
