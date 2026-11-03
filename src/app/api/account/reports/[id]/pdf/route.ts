import { profileReportPdf } from "@/server/profile-pdf";
import { withUser } from "@/server/http";

export const maxDuration = 800;

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withUser(req, async (user) => {
    const file = await profileReportPdf(user, id);
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}
