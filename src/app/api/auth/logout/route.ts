import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  jar.delete("sa_uid");
  return Response.json({ ok: true });
}
