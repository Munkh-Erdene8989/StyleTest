import { randomUUID } from "crypto";
import { AppError } from "@/domain/errors";
import { extensionFor, imageFormatOk } from "@/domain/images";
import { canOperate } from "@/server/auth";
import { errorResponse, withUser } from "@/server/http";
import { getStore } from "@/server/store";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    try {
      if (!canOperate(user.role)) throw new AppError("forbidden", 403);
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new AppError("invalid_image", 400);
      const bytes = Buffer.from(await file.arrayBuffer());
      const contentType = file.type === "image/jpg" ? "image/jpeg" : file.type;
      if (bytes.length > 4_000_000 || !imageFormatOk(bytes, contentType)) throw new AppError("invalid_image", 400);
      const id = `${randomUUID()}.${extensionFor(contentType)}`;
      await getStore().putObject(`site/${id}`, bytes, contentType);
      return Response.json({ url: `/api/site-media/${id}` });
    } catch (error) {
      return errorResponse(error);
    }
  });
}
