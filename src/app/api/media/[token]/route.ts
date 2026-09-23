import { getStore } from "@/server/store";

export async function GET(_req: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const store = getStore();
  const path = await store.resolveReadToken(token);
  if (!path) return new Response("not_found", { status: 404 });
  const object = await store.getObject(path);
  if (!object) return new Response("not_found", { status: 404 });
  return new Response(new Uint8Array(object.bytes), {
    headers: { "Content-Type": object.contentType, "Cache-Control": "private, max-age=60" },
  });
}
