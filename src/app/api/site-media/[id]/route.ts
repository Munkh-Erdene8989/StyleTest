import { getStore } from "@/server/store";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(id)) return new Response("not_found", { status: 404 });
  const object = await getStore().getObject(`site/${id}`);
  if (!object) return new Response("not_found", { status: 404 });
  return new Response(new Uint8Array(object.bytes), {
    headers: { "Content-Type": object.contentType, "Cache-Control": "public, max-age=86400" },
  });
}
