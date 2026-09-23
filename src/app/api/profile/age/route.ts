import { ageBandFromDob } from "@/domain/age";
import { AppError } from "@/domain/errors";
import { getStore } from "@/server/store";
import { errorResponse, readJson, withUser } from "@/server/http";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    try {
      const body = await readJson(req);
      const dateOfBirth = String(body.dateOfBirth ?? "");
      const ageBand = ageBandFromDob(dateOfBirth);
      if (ageBand === "unknown") throw new AppError("invalid_age", 400);
      user.dateOfBirth = dateOfBirth;
      user.ageBand = ageBand;
      await getStore().saveUser(user);
      return Response.json({ ageBand });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
