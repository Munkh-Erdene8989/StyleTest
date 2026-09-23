import type { Order, Report, Session, Upload } from "./types";

const DAY = 24 * 60 * 60 * 1000;

export function retentionPlan(input: {
  now: Date;
  sessions: Session[];
  reports: Report[];
  uploads: Upload[];
  orders: Order[];
}) {
  const paidSessions = new Set(
    input.orders.filter((order) => order.paymentStatus === "paid").map((order) => order.sessionId),
  );
  const sessionIds: string[] = [];
  for (const session of input.sessions) {
    const age = input.now.getTime() - new Date(session.createdAt).getTime();
    const unfinished = session.status === "in_progress" && session.anonymousOwner && age > 14 * DAY;
    const abandonedGuest =
      session.status === "completed" &&
      session.anonymousOwner &&
      !paidSessions.has(session.id) &&
      age > 14 * DAY;
    if (unfinished || abandonedGuest) sessionIds.push(session.id);
  }
  const objectPaths: string[] = [];
  const reportIds: string[] = [];
  for (const report of input.reports) {
    if (!report.expiresAt) continue;
    if (new Date(report.expiresAt).getTime() > input.now.getTime()) continue;
    if (paidSessions.has(report.sessionId)) continue;
    reportIds.push(report.id);
    objectPaths.push(...report.assetPaths);
  }
  const uploadIds: string[] = [];
  for (const upload of input.uploads) {
    if (upload.deletedAt) continue;
    const age = input.now.getTime() - new Date(upload.createdAt).getTime();
    const unlinked = !upload.linked && age > DAY;
    const sessionGone = sessionIds.includes(upload.sessionId);
    if (unlinked || sessionGone) {
      uploadIds.push(upload.id);
      objectPaths.push(upload.path);
    }
  }
  return { sessionIds, reportIds, uploadIds, objectPaths };
}
