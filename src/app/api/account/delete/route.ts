import { cookies } from "next/headers";
import { deleteAccount } from "@/server/account-service";
import { readJson, withUser } from "@/server/http";
import { AppError } from "@/domain/errors";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    if (body.confirm !== "устгах") throw new AppError("confirm_required", 400);
    const result = await deleteAccount(user);
    const jar = await cookies();
    jar.delete("sa_uid");
    return Response.json(result);
  });
}
