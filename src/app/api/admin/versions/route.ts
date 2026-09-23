import { updateVersion } from "@/server/admin-service";
import { readJson, withUser } from "@/server/http";
import type { VersionStatus } from "@/domain/types";

export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req);
    const result = await updateVersion(user, {
      versionId: String(body.versionId ?? ""),
      status: String(body.status ?? "demo") as VersionStatus,
      translationReview: body.translationReview === "reviewed" ? "reviewed" : "none",
      licenseRef: body.licenseRef ? String(body.licenseRef) : null,
    });
    return Response.json(result);
  });
}
