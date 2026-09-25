import { createHash, randomBytes } from "crypto";
import { getFirestore, type DocumentData, type Firestore } from "firebase-admin/firestore";
import { adminApp } from "../firebase-admin";
import { resolveAppName } from "@/domain/brand";
import { AppError } from "@/domain/errors";
import type { AppStore, EmailOtp } from "./types";
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

const OBJECT_CHUNK = 480_000;

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
    if (existing) {
      const name = resolveAppName(existing.appName);
      if (name !== existing.appName) {
        existing.appName = name;
        await this.put("siteConfig", "public", existing);
      }
      return existing;
    }
    const config: SiteConfig = {
      appName: resolveAppName(process.env.NEXT_PUBLIC_APP_NAME),
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

  async putObject(path: string, bytes: Buffer, contentType: string) {
    const ref = this.objectRef(path);
    const parts = Math.max(1, Math.ceil(bytes.length / OBJECT_CHUNK));
    await ref.set({ path, contentType, parts, bytes: bytes.length });
    for (let index = 0; index < parts; index += 1) {
      const slice = bytes.subarray(index * OBJECT_CHUNK, (index + 1) * OBJECT_CHUNK);
      await ref.collection("parts").doc(String(index)).set({ data: slice.toString("base64") });
    }
    const existing = await ref.collection("parts").get();
    for (const doc of existing.docs) {
      if (Number(doc.id) >= parts) await doc.ref.delete();
    }
  }
  async getObject(path: string) {
    const ref = this.objectRef(path);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const meta = snap.data() as { contentType?: string; parts?: number };
    const parts = meta.parts ?? 0;
    const chunks: Buffer[] = [];
    for (let index = 0; index < parts; index += 1) {
      const part = await ref.collection("parts").doc(String(index)).get();
      const data = part.data()?.data;
      if (!part.exists || typeof data !== "string") return null;
      chunks.push(Buffer.from(data, "base64"));
    }
    return { bytes: Buffer.concat(chunks), contentType: meta.contentType || "application/octet-stream" };
  }
  async deleteObject(path: string) {
    const ref = this.objectRef(path);
    const parts = await ref.collection("parts").get();
    for (const doc of parts.docs) await doc.ref.delete();
    await ref.delete();
  }
  async createReadUrl(path: string) {
    const token = randomBytes(24).toString("hex");
    await this.put("mediaTokens", token, { path, exp: Date.now() + 5 * 60 * 1000 });
    return `/api/media/${token}`;
  }
  async resolveReadToken(token: string) {
    const row = await this.read<{ path: string; exp: number }>("mediaTokens", token);
    if (!row || row.exp < Date.now()) return null;
    return row.path;
  }

  private objectRef(path: string) {
    const id = createHash("sha256").update(path).digest("hex");
    return this.database().collection("objects").doc(id);
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

  async saveEmailOtp(otp: EmailOtp) {
    const email = otp.email.toLowerCase();
    await this.put("emailOtps", email, { ...otp, email });
  }
  async getEmailOtp(email: string) {
    return this.read<EmailOtp>("emailOtps", email.toLowerCase());
  }
  async deleteEmailOtp(email: string) {
    await this.database().collection("emailOtps").doc(email.toLowerCase()).delete();
  }
}
