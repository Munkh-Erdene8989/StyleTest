import { updateSite } from "@/server/admin-service";
import { readJson, withUser } from "@/server/http";
import { studioFrom } from "@/domain/studio-profile";
import type { HelpContact, StudioProfile } from "@/domain/types";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    const site = await updateSite(user, {
      appName: typeof body.appName === "string" ? body.appName : undefined,
      helpContacts: Array.isArray(body.helpContacts) ? (body.helpContacts as HelpContact[]) : undefined,
      studio: body.studio && typeof body.studio === "object" ? (body.studio as StudioProfile) : undefined,
      quizPriceMnt: "quizPriceMnt" in body ? body.quizPriceMnt : undefined,
    });
    return Response.json({
      appName: site.appName,
      helpContacts: site.helpContacts,
      studio: studioFrom(site.studio),
      quizPriceMnt: site.quizPriceMnt,
    });
  });
}
