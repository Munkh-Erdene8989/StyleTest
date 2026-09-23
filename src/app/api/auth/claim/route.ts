import { cookies } from "next/headers";
import { moveOwnership } from "@/server/auth";
import { readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    const previousUid = String(body.previousUid ?? "");
    if (previousUid) await moveOwnership(previousUid, user.id);
    const jar = await cookies();
    jar.set("sa_uid", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return Response.json({ id: user.id, email: user.email });
  });
}
