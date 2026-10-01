import { readColorPlate, plateContentDisposition } from "@/server/color-plates";
import { errorResponse } from "@/server/http";

export async function GET(_req: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  try {
    const plate = await readColorPlate(code);
    if (!plate) return new Response("not_found", { status: 404 });
    return new Response(new Uint8Array(plate.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": plateContentDisposition(plate.filename),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
