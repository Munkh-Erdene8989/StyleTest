import { applyCallback } from "@/server/order-service";
import { errorResponse, readJson } from "@/server/http";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const invoice = new URL(req.url).searchParams.get("invoice_id") ?? undefined;
    const result = await applyCallback(body, invoice);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
