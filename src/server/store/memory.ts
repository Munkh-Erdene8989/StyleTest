import { randomBytes } from "crypto";
import { resolveAppName } from "@/domain/brand";
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
  StoredObject,
  StylePackage,
  Upload,
  User,
  VersionOverride,
} from "@/domain/types";
import { AppError } from "@/domain/errors";

type Bag = {
  users: Map<string, User>;
  sessions: Map<string, Session>;
  scores: Map<string, Score>;
  jobs: Map<string, GenerationJob>;
  reports: Map<string, Report>;
  orders: Map<string, Order>;
  entitlements: Map<string, Entitlement>;
  uploads: Map<string, Upload>;
  refunds: Map<string, RefundRequest>;
  events: Map<string, AnalyticsEvent>;
  audit: Map<string, AuditLog>;
  ledger: Map<string, LedgerEntry>;
  emails: Map<string, EmailDelivery>;
  overrides: Map<string, VersionOverride>;
  packages: Map<string, StylePackage>;
  objects: Map<string, StoredObject>;
  media: Map<string, { path: string; exp: number }>;
  rates: Map<string, { count: number; reset: number }>;
  otps: Map<string, EmailOtp>;
  site: SiteConfig | null;
  chain: Promise<unknown>;
};

function bag(): Bag {
  return {
    users: new Map(),
    sessions: new Map(),
    scores: new Map(),
    jobs: new Map(),
    reports: new Map(),
    orders: new Map(),
    entitlements: new Map(),
    uploads: new Map(),
    refunds: new Map(),
    events: new Map(),
    audit: new Map(),
    ledger: new Map(),
    emails: new Map(),
    overrides: new Map(),
    packages: new Map(),
    objects: new Map(),
    media: new Map(),
    rates: new Map(),
    otps: new Map(),
    site: null,
    chain: Promise.resolve(),
  };
}

export class MemoryStore implements AppStore {
  constructor(private db = bag()) {}

  private async lock<T>(fn: () => Promise<T>) {
    const run = this.db.chain.then(fn, fn);
    this.db.chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async getUser(id: string) {
    return this.db.users.get(id) ?? null;
  }
  async saveUser(user: User) {
    this.db.users.set(user.id, user);
  }
  async findUserByEmail(email: string) {
    const target = email.toLowerCase();
    return [...this.db.users.values()].find((user) => user.email?.toLowerCase() === target) ?? null;
  }

  async saveSession(session: Session) {
    this.db.sessions.set(session.id, session);
  }
  async getSession(id: string) {
    return this.db.sessions.get(id) ?? null;
  }
  async listSessionsByOwner(uid: string) {
    return [...this.db.sessions.values()].filter((session) => session.ownerUid === uid);
  }
  async listSessions() {
    return [...this.db.sessions.values()];
  }
  async deleteSession(id: string) {
    this.db.sessions.delete(id);
    this.db.scores.delete(id);
  }

  async saveScore(score: Score) {
    this.db.scores.set(score.sessionId, score);
  }
  async getScore(sessionId: string) {
    return this.db.scores.get(sessionId) ?? null;
  }

  async saveJob(job: GenerationJob) {
    this.db.jobs.set(job.id, job);
  }
  async getJob(id: string) {
    return this.db.jobs.get(id) ?? null;
  }
  async listJobs() {
    return [...this.db.jobs.values()];
  }

  async saveReport(report: Report) {
    this.db.reports.set(report.id, report);
  }
  async getReport(id: string) {
    return this.db.reports.get(id) ?? null;
  }
  async listReportsByOwner(uid: string) {
    return [...this.db.reports.values()].filter((report) => report.ownerUid === uid);
  }
  async listReports() {
    return [...this.db.reports.values()];
  }
  async deleteReport(id: string) {
    this.db.reports.delete(id);
  }

  async saveOrder(order: Order) {
    this.db.orders.set(order.id, order);
  }
  async getOrder(id: string) {
    return this.db.orders.get(id) ?? null;
  }
  async listOrdersByOwner(uid: string) {
    return [...this.db.orders.values()].filter((order) => order.ownerUid === uid);
  }
  async listOrders() {
    return [...this.db.orders.values()];
  }
  async findOrderByInvoice(invoiceId: string) {
    return [...this.db.orders.values()].find((order) => order.qpayInvoiceId === invoiceId) ?? null;
  }
  async updateOrder(id: string, update: (current: Order) => Order) {
    return this.lock(async () => {
      const previous = this.db.orders.get(id);
      if (!previous) throw new AppError("not_found", 404);
      const next = update(structuredClone(previous));
      this.db.orders.set(id, next);
      return { previous, next };
    });
  }

  async saveEntitlement(entitlement: Entitlement) {
    this.db.entitlements.set(entitlement.id, entitlement);
  }
  async getEntitlement(id: string) {
    return this.db.entitlements.get(id) ?? null;
  }
  async listEntitlementsByOwner(uid: string) {
    return [...this.db.entitlements.values()].filter((item) => item.ownerUid === uid);
  }

  async saveUpload(upload: Upload) {
    this.db.uploads.set(upload.id, upload);
  }
  async getUpload(id: string) {
    return this.db.uploads.get(id) ?? null;
  }
  async listUploadsByOwner(uid: string) {
    return [...this.db.uploads.values()].filter((upload) => upload.ownerUid === uid);
  }
  async listUploads() {
    return [...this.db.uploads.values()];
  }

  async saveRefund(refund: RefundRequest) {
    this.db.refunds.set(refund.id, refund);
  }
  async getRefundByOrder(orderId: string) {
    return [...this.db.refunds.values()].find((refund) => refund.orderId === orderId) ?? null;
  }
  async listRefunds() {
    return [...this.db.refunds.values()];
  }

  async saveEvent(event: AnalyticsEvent) {
    this.db.events.set(event.id, event);
  }
  async getEvent(id: string) {
    return this.db.events.get(id) ?? null;
  }
  async listEvents() {
    return [...this.db.events.values()];
  }

  async saveAudit(log: AuditLog) {
    this.db.audit.set(log.id, log);
  }
  async listAudit() {
    return [...this.db.audit.values()];
  }

  async saveLedger(entry: LedgerEntry) {
    this.db.ledger.set(entry.id, entry);
  }
  async getLedger(id: string) {
    return this.db.ledger.get(id) ?? null;
  }
  async listLedger() {
    return [...this.db.ledger.values()];
  }

  async getEmail(key: string) {
    return this.db.emails.get(key) ?? null;
  }
  async saveEmail(email: EmailDelivery) {
    this.db.emails.set(email.key, email);
  }

  async getSiteConfig() {
    if (!this.db.site) {
      this.db.site = {
        appName: resolveAppName(process.env.NEXT_PUBLIC_APP_NAME),
        helpContacts: [],
        funCopy: {},
      };
    }
    this.db.site.appName = resolveAppName(this.db.site.appName);
    return this.db.site;
  }
  async saveSiteConfig(config: SiteConfig) {
    this.db.site = config;
  }

  async getVersionOverride(id: string) {
    return this.db.overrides.get(id) ?? null;
  }
  async saveVersionOverride(override: VersionOverride) {
    this.db.overrides.set(override.versionId, override);
  }

  async saveStylePackage(pkg: StylePackage) {
    this.db.packages.set(pkg.sessionId, pkg);
  }
  async getStylePackage(sessionId: string) {
    return this.db.packages.get(sessionId) ?? null;
  }

  async putObject(path: string, bytes: Buffer, contentType: string) {
    this.db.objects.set(path, { bytes, contentType });
  }
  async getObject(path: string) {
    return this.db.objects.get(path) ?? null;
  }
  async deleteObject(path: string) {
    this.db.objects.delete(path);
  }
  async createReadUrl(path: string) {
    const token = randomBytes(24).toString("hex");
    this.db.media.set(token, { path, exp: Date.now() + 5 * 60 * 1000 });
    return `/api/media/${token}`;
  }
  async resolveReadToken(token: string) {
    const row = this.db.media.get(token);
    if (!row || row.exp < Date.now()) return null;
    return row.path;
  }

  async bumpRate(key: string, limit: number, windowMs: number, now: number) {
    const current = this.db.rates.get(key);
    if (!current || current.reset <= now) {
      this.db.rates.set(key, { count: 1, reset: now + windowMs });
      return true;
    }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
  }

  async saveEmailOtp(otp: EmailOtp) {
    this.db.otps.set(otp.email.toLowerCase(), otp);
  }
  async getEmailOtp(email: string) {
    return this.db.otps.get(email.toLowerCase()) ?? null;
  }
  async deleteEmailOtp(email: string) {
    this.db.otps.delete(email.toLowerCase());
  }
}
