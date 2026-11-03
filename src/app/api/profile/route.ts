import { cookies } from "next/headers";
import { updateProfile } from "@/server/profile-service";
import { readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    const saved = await updateProfile(user, {
      dateOfBirth: String(body.dateOfBirth ?? ""),
      gender: String(body.gender ?? ""),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      bodyFigure: String(body.bodyFigure ?? ""),
    });
    if (saved.id !== user.id) {
      const jar = await cookies();
      jar.set("sa_uid", saved.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return Response.json({ ok: true });
  });
}
