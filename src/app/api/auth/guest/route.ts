import { ensureGuest } from "@/server/auth";
import { errorResponse } from "@/server/http";

export async function POST() {
  try {
    const user = await ensureGuest();
    return Response.json({ id: user.id, ageBand: user.ageBand, email: user.email });
  } catch (error) {
    return errorResponse(error);
  }
}
