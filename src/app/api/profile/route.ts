import { updateProfile } from "@/server/profile-service";
import { readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    await updateProfile(user, {
      dateOfBirth: String(body.dateOfBirth ?? ""),
      gender: String(body.gender ?? ""),
      phone: String(body.phone ?? ""),
      bodyFigure: String(body.bodyFigure ?? ""),
    });
    return Response.json({ ok: true });
  });
}
