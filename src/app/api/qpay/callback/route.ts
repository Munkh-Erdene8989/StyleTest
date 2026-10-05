import { errorResponse, readJson } from "@/server/http";
import { receivePaymentCallback } from "@/server/settlement";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const invoice = new URL(req.url).searchParams.get("invoice_id") ?? undefined;
    return Response.json(await receivePaymentCallback(body, invoice));
  } catch (error) {
    return errorResponse(error);
  }
}
