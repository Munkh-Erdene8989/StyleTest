import type { Entitlement, Report, Session, Upload } from "./types";

export function originalPhotoDeletion(uploads: Upload[]) {
  const targets = uploads.filter((upload) => !upload.deletedAt && (upload.role === "face" || upload.role === "body"));
  return {
    uploadIds: targets.map((upload) => upload.id),
    paths: targets.map((upload) => upload.path),
  };
}

export function accountDeletion(input: {
  userId: string;
  sessions: Session[];
  reports: Report[];
  uploads: Upload[];
  entitlements: Entitlement[];
}) {
  const paths = [
    ...input.uploads.filter((upload) => !upload.deletedAt).map((upload) => upload.path),
    ...input.reports.flatMap((report) => report.assetPaths),
  ];
  return {
    userId: input.userId,
    sessionIds: input.sessions.map((session) => session.id),
    reportIds: input.reports.map((report) => report.id),
    uploadIds: input.uploads.map((upload) => upload.id),
    revokeEntitlementIds: input.entitlements
      .filter((item) => item.status !== "revoked")
      .map((item) => item.id),
    paths,
  };
}
