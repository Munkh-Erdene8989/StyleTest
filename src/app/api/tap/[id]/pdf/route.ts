import { downloadTapPdf } from "@/server/tap-service";
import { withGuest } from "@/server/http";

export const maxDuration = 800;

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  return withGuest(req, async (user) => {
    const { id } = await context.params;
    const bytes = await downloadTapPdf(user, id);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="naruka-1-tap.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  });
}
