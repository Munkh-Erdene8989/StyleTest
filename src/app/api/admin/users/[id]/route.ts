import { userAnswers } from "@/server/admin-service";
import { errorResponse, withUser } from "@/server/http";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  return withUser(req, async (user) => {
    try {
      const { id } = await context.params;
      return Response.json(await userAnswers(user, id));
    } catch (error) {
      return errorResponse(error);
    }
  });
}
