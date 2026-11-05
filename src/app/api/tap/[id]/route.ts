import { readTap } from "@/server/tap-service";
import { withGuest } from "@/server/http";

export const maxDuration = 60;

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  return withGuest(req, async (user) => {
    const { id } = await context.params;
    return Response.json(await readTap(user, id));
  });
}
