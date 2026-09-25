import { cookies } from "next/headers";
import { verifyEmailOtp } from "@/server/auth";
import { errorResponse, readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    try {
      const body = await readJson(req);
      const account = await verifyEmailOtp(user.id, String(body.email ?? ""), String(body.code ?? ""));
      const jar = await cookies();
      jar.set("sa_uid", account.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });
      return Response.json({ id: account.id, email: account.email });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
