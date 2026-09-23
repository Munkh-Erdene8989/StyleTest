import { getFirestore, type DocumentData, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { adminApp } from "../firebase-admin";
import { AppError } from "@/domain/errors";
import type { AppStore } from "./types";
import type {
  AnalyticsEvent,
  AuditLog,
  EmailDelivery,
  Entitlement,
  GenerationJob,
  LedgerEntry,
  Order,
  RefundRequest,
  Report,
  Score,
  Session,
  SiteConfig,
  StylePackage,
  Upload,
  User,
  VersionOverride,
} from "@/domain/types";

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class FirestoreStore implements AppStore {
  private database(): Firestore {
    const app = adminApp();
    if (!app) throw new AppError("firebase_unconfigured", 500);
    return getFirestore(app);
  }

  private async put<T>(collection: string, id: string, value: T) {
    await this.database().collection(collection).doc(id).set(clean(value) as DocumentData);
  }

  private async read<T>(collection: string, id: string) {
    const snap = await this.database().collection(collection).doc(id).get();
    return snap.exists ? (snap.data() as T) : null;
  }

  private async all<T>(collection: string) {
    const snap = await this.database().collection(collection).get();
    return snap.docs.map((doc) => doc.data() as T);
  }

  async getUser(id: string) {
    return this.read<User>("users", id);
  }
  async saveUser(user: User) {
    await this.put("users", user.id, user);
  }
  async findUserByEmail(email: string) {
    const snap = await this.database().collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
    return (snap.docs[0]?.data() as User | undefined) ?? null;
  }

  async saveSession(session: Session) {
    await this.put("sessions", session.id, session);
  }
  async getSession(id: string) {
    return this.read<Session>("sessions", id);
  }
  async listSessionsByOwner(uid: string) {
    const snap = await this.database().collection("sessions").where("ownerUid", "==", uid).get();
    return snap.docs.map((doc) => doc.data() as Session);
  }
  async listSessions() {
    return this.all<Session>("sessions");
  }
  async deleteSession(id: string) {
    await this.database().collection("sessions").doc(id).delete();
    await this.database().collection("scores").doc(id).delete();
  }

  async saveScore(score: Score) {
    await this.put("scores", score.sessionId, score);
  }
  async getScore(sessionId: string) {
    return this.read<Score>("scores", sessionId);
  }

  async saveJob(job: GenerationJob) {
    await this.put("generationJobs", job.id, job);
  }
  async getJob(id: string) {
    return this.read<GenerationJob>("generationJobs", id);
  }
  async listJobs() {
    return this.all<GenerationJob>("generationJobs");
  }

  async saveReport(report: Report) {
    await this.put("reports", report.id, report);
  }
  async getReport(id: string) {
    return this.read<Report>("reports", id);
  }
  async listReportsByOwner(uid: string) {
    const snap = await this.database().collection("reports").where("ownerUid", "==", uid).get();
    return snap.docs.map((doc) => doc.data() as Report);
  }
  async listReports() {
    return this.all<Report>("reports");
  }
  async deleteReport(id: string) {
    await this.database().collection("reports").doc(id).delete();
  }

  async saveOrder(order: Order) {
    await this.put("orders", order.id, order);
  }
  async getOrder(id: string) {
    return this.read<Order>("orders", id);
  }
  async listOrdersByOwner(uid: string) {
    const snap = await this.database().collection("orders").where("ownerUid", "==", uid).get();
    return snap.docs.map((doc) => doc.data() as Order);
  }
  async listOrders() {
    return this.all<Order>("orders");
  }
  async findOrderByInvoice(invoiceId: string) {
    const snap = await this.database().collection("orders").where("qpayInvoiceId", "==", invoiceId).limit(1).get();
    return (snap.docs[0]?.data() as Order | undefined) ?? null;
  }
  async updateOrder(id: string, update: (current: Order) => Order) {
    const ref = this.database().collection("orders").doc(id);
    return this.database().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new AppError("not_found", 404);
      const previous = snap.data() as Order;
      const next = update(previous);
      tx.set(ref, clean(next));
      return { previous, next };
    });
  }

  async saveEntitlement(entitlement: Entitlement) {
    await this.put("entitlements", entitlement.id, entitlement);
  }
  async getEntitlement(id: string) {
    return this.read<Entitlement>("entitlements", id);
  }
  async listEntitlementsByOwner(uid: string) {
    const snap = await this.database().collection("entitlements").where("ownerUid", "==", uid).get();
    return snap.docs.map((doc) => doc.data() as Entitlement);
  }

  async saveUpload(upload: Upload) {
    await this.put("uploads", upload.id, upload);
  }
  async getUpload(id: string) {
    return this.read<Upload>("uploads", id);
  }
  async listUploadsByOwner(uid: string) {
    const snap = await this.database().collection("uploads").where("ownerUid", "==", uid).get();
    return snap.docs.map((doc) => doc.data() as Upload);
  }
  async listUploads() {
    return this.all<Upload>("uploads");
  }

  async saveRefund(refund: RefundRequest) {
    await this.put("refunds", refund.id, refund);
  }
  async getRefundByOrder(orderId: string) {
    const snap = await this.database().collection("refunds").where("orderId", "==", orderId).limit(1).get();
    return (snap.docs[0]?.data() as RefundRequest | undefined) ?? null;
  }
  async listRefunds() {
    return this.all<RefundRequest>("refunds");
  }

  async saveEvent(event: AnalyticsEvent) {
    await this.put("events", event.id, event);
  }
  async getEvent(id: string) {
    return this.read<AnalyticsEvent>("events", id);
  }
  async listEvents() {
    return this.all<AnalyticsEvent>("events");
  }

  async saveAudit(log: AuditLog) {
    await this.put("auditLogs", log.id, log);
  }
  async listAudit() {
    return this.all<AuditLog>("auditLogs");
  }

  async saveLedger(entry: LedgerEntry) {
    await this.put("ledgerEntries", entry.id, entry);
  }
  async getLedger(id: string) {
    return this.read<LedgerEntry>("ledgerEntries", id);
  }
  async listLedger() {
    return this.all<LedgerEntry>("ledgerEntries");
  }

  async getEmail(key: string) {
    return this.read<EmailDelivery>("emailDeliveries", key);
  }
  async saveEmail(email: EmailDelivery) {
    await this.put("emailDeliveries", email.key, email);
  }

  async getSiteConfig() {
    const existing = await this.read<SiteConfig>("siteConfig", "public");
    if (existing) return existing;
    const config: SiteConfig = {
      appName: process.env.NEXT_PUBLIC_APP_NAME || "StyleAI",
      helpContacts: [],
      funCopy: {},
    };
    await this.put("siteConfig", "public", config);
    return config;
  }
  async saveSiteConfig(config: SiteConfig) {
    await this.put("siteConfig", "public", config);
  }

  async getVersionOverride(id: string) {
    return this.read<VersionOverride>("versionOverrides", id);
  }
  async saveVersionOverride(override: VersionOverride) {
    await this.put("versionOverrides", override.versionId, override);
  }

  async saveStylePackage(pkg: StylePackage) {
    await this.put("stylePackages", pkg.sessionId, pkg);
  }
  async getStylePackage(sessionId: string) {
    return this.read<StylePackage>("stylePackages", sessionId);
  }

  private bucket() {
    const app = adminApp();
    if (!app) throw new AppError("firebase_unconfigured", 500);
    return getStorage(app).bucket();
  }

  async putObject(path: string, bytes: Buffer, contentType: string) {
    await this.bucket().file(path).save(bytes, { contentType, resumable: false });
  }
  async getObject(path: string) {
    const file = this.bucket().file(path);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [bytes] = await file.download();
    const [meta] = await file.getMetadata();
    return { bytes, contentType: meta.contentType || "application/octet-stream" };
  }
  async deleteObject(path: string) {
    await this.bucket().file(path).delete({ ignoreNotFound: true });
  }
  async createReadUrl(path: string) {
    const [url] = await this.bucket().file(path).getSignedUrl({
      action: "read",
      expires: Date.now() + 5 * 60 * 1000,
      version: "v4",
    });
    return url;
  }
  async resolveReadToken() {
    return null;
  }

  async bumpRate(key: string, limit: number, windowMs: number, now: number) {
    const ref = this.database().collection("rateLimits").doc(key);
    return this.database().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.data() as { count: number; reset: number } | undefined;
      if (!current || current.reset <= now) {
        tx.set(ref, { count: 1, reset: now + windowMs });
        return true;
      }
      if (current.count >= limit) return false;
      tx.set(ref, { count: current.count + 1, reset: current.reset });
      return true;
    });
  }

  async savePendingClaim(email: string, uid: string) {
    await this.put("pendingClaims", email.toLowerCase(), { email: email.toLowerCase(), uid });
  }
  async getPendingClaim(email: string) {
    const row = await this.read<{ uid: string }>("pendingClaims", email.toLowerCase());
    return row?.uid ?? null;
  }
}
