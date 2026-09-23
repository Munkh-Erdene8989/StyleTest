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

export interface AppStore {
  getUser(id: string): Promise<User | null>;
  saveUser(user: User): Promise<void>;
  findUserByEmail(email: string): Promise<User | null>;

  saveSession(session: Session): Promise<void>;
  getSession(id: string): Promise<Session | null>;
  listSessionsByOwner(uid: string): Promise<Session[]>;
  listSessions(): Promise<Session[]>;
  deleteSession(id: string): Promise<void>;

  saveScore(score: Score): Promise<void>;
  getScore(sessionId: string): Promise<Score | null>;

  saveJob(job: GenerationJob): Promise<void>;
  getJob(id: string): Promise<GenerationJob | null>;
  listJobs(): Promise<GenerationJob[]>;

  saveReport(report: Report): Promise<void>;
  getReport(id: string): Promise<Report | null>;
  listReportsByOwner(uid: string): Promise<Report[]>;
  listReports(): Promise<Report[]>;
  deleteReport(id: string): Promise<void>;

  saveOrder(order: Order): Promise<void>;
  getOrder(id: string): Promise<Order | null>;
  listOrdersByOwner(uid: string): Promise<Order[]>;
  listOrders(): Promise<Order[]>;
  findOrderByInvoice(invoiceId: string): Promise<Order | null>;
  updateOrder(id: string, update: (current: Order) => Order): Promise<{ previous: Order; next: Order }>;

  saveEntitlement(entitlement: Entitlement): Promise<void>;
  getEntitlement(id: string): Promise<Entitlement | null>;
  listEntitlementsByOwner(uid: string): Promise<Entitlement[]>;

  saveUpload(upload: Upload): Promise<void>;
  getUpload(id: string): Promise<Upload | null>;
  listUploadsByOwner(uid: string): Promise<Upload[]>;
  listUploads(): Promise<Upload[]>;

  saveRefund(refund: RefundRequest): Promise<void>;
  getRefundByOrder(orderId: string): Promise<RefundRequest | null>;
  listRefunds(): Promise<RefundRequest[]>;

  saveEvent(event: AnalyticsEvent): Promise<void>;
  getEvent(id: string): Promise<AnalyticsEvent | null>;
  listEvents(): Promise<AnalyticsEvent[]>;

  saveAudit(log: AuditLog): Promise<void>;
  listAudit(): Promise<AuditLog[]>;

  saveLedger(entry: LedgerEntry): Promise<void>;
  getLedger(id: string): Promise<LedgerEntry | null>;
  listLedger(): Promise<LedgerEntry[]>;

  getEmail(key: string): Promise<EmailDelivery | null>;
  saveEmail(email: EmailDelivery): Promise<void>;

  getSiteConfig(): Promise<SiteConfig>;
  saveSiteConfig(config: SiteConfig): Promise<void>;

  getVersionOverride(id: string): Promise<VersionOverride | null>;
  saveVersionOverride(override: VersionOverride): Promise<void>;

  saveStylePackage(pkg: StylePackage): Promise<void>;
  getStylePackage(sessionId: string): Promise<StylePackage | null>;

  putObject(path: string, bytes: Buffer, contentType: string): Promise<void>;
  getObject(path: string): Promise<StoredObject | null>;
  deleteObject(path: string): Promise<void>;
  createReadUrl(path: string): Promise<string>;
  resolveReadToken(token: string): Promise<string | null>;

  bumpRate(key: string, limit: number, windowMs: number, now: number): Promise<boolean>;
  savePendingClaim(email: string, uid: string): Promise<void>;
  getPendingClaim(email: string): Promise<string | null>;
}
