export type AgeBand = "unknown" | "under18" | "adult";

export type TestKind = "personality" | "stress" | "fun" | "youth" | "style";

export type VersionStatus = "demo" | "license_pending" | "approved";

export type ProductCode = "personality_report" | "style_package" | "style_addon";

export type JobKind = ProductCode;

export type JobStatus = "pending" | "processing" | "ready" | "failed" | "expired";

export type PaymentStatus =
  | "draft"
  | "invoiced"
  | "paid"
  | "expired"
  | "refund_requested"
  | "refunded"
  | "refund_rejected"
  | "refund_manual_pending";

export type EntitlementStatus = "locked" | "unlocking" | "active" | "revoked";

export type PayChannel = "unknown" | "card" | "bank_qr" | "other";

export type UserRole = "user" | "ops" | "sensitive" | "ops_sensitive";

export type Question = {
  id: string;
  text: string;
  options: { id: string; label: string; score: number }[];
};

export type ResultBand = {
  id: string;
  min: number;
  max: number;
  title: string;
  summary: string;
  detail: string[];
  paidOutline: string[];
};

export type MethodologyVersion = {
  id: string;
  testId: string;
  version: number;
  status: VersionStatus;
  locale: "mn";
  translationReview: "none" | "reviewed";
  licenseRef: string | null;
  title: string;
  description: string;
  minutes: number;
  minAge: number;
  maxAge: number | null;
  kind: TestKind;
  disclaimer: string;
  questions: Question[];
  bands: ResultBand[];
};

export type TestDefinition = {
  id: string;
  slug: string;
  kind: TestKind;
  activeVersionId: string;
  priceMnt: number;
  productCode: ProductCode | null;
};

export type Palette = "neutral" | "warm" | "contrast" | "earth";
export type Silhouette = "straight" | "relaxed";
export type Formality = "casual" | "smart";
export type PatternDensity = "none" | "low" | "mid";

export type StyleDirection = {
  id: string;
  title: string;
  paletteFamily: Palette;
  silhouette: Silhouette;
  formality: Formality;
  patternDensity: PatternDensity;
  reasonHint: string;
};

export type StyleExample = {
  id: string;
  title: string;
  paletteFamily: Palette;
  silhouette: Silhouette;
  formality: Formality;
  patternDensity: PatternDensity;
};

export type User = {
  id: string;
  email: string | null;
  dateOfBirth: string | null;
  ageBand: AgeBand;
  anonymous: boolean;
  role: UserRole;
  createdAt: string;
};

export type StyleInput = {
  likedIds: string[];
  aspireIds: string[];
  dislikedIds: string[];
  lifestyle: "office" | "home" | "mixed";
  comfort: string;
  request: string;
  usePersonality: boolean;
  personalitySessionId?: string;
  consentAt?: string;
  faceUploadId?: string;
  bodyUploadId?: string;
  selectedDirectionIds?: string[];
};

export type Session = {
  id: string;
  ownerUid: string;
  kind: TestKind;
  testId: string;
  versionId: string;
  answers: Record<string, string>;
  styleInput?: StyleInput;
  status: "in_progress" | "completed" | "expired";
  anonymousOwner: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type Score = {
  sessionId: string;
  versionId: string;
  raw: number;
  bandId: string;
  computedBy: "deterministic";
};

export type GenerationJob = {
  id: string;
  sessionId: string;
  ownerUid: string;
  kind: JobKind;
  addonDirectionId?: string;
  status: JobStatus;
  attempt: number;
  maxAttempts: number;
  provider?: string;
  model?: string;
  usage?: { inputTokens: number; outputTokens: number; imageCount: number };
  costUsd: number;
  attemptCosts: number[];
  billablePurchaseId: string | null;
  inputHash: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type Report = {
  id: string;
  sessionId: string;
  ownerUid: string;
  versionId: string;
  kind: TestKind | ProductCode;
  summary: { title: string; body: string; disclaimer?: string };
  outline: string[];
  fullContent: unknown | null;
  assetPaths: string[];
  generationJobId?: string;
  priceMnt: number;
  expiresAt?: string;
  createdAt: string;
};

export type Order = {
  id: string;
  ownerUid: string;
  productCode: ProductCode;
  amount: number;
  currency: "MNT";
  sessionId: string;
  reportId: string;
  addonDirectionId?: string;
  paymentStatus: PaymentStatus;
  qpayInvoiceId?: string;
  qpayPaymentId?: string;
  channel: PayChannel;
  qrImage?: string;
  urls?: { name: string; link: string }[];
  paidAt?: string;
  createdAt: string;
};

export type Entitlement = {
  id: string;
  ownerUid: string;
  orderId: string;
  targetId: string;
  status: EntitlementStatus;
  grantedAt?: string;
  revokedAt?: string;
};

export type Upload = {
  id: string;
  ownerUid: string;
  sessionId: string;
  role: "face" | "body";
  path: string;
  contentType: string;
  consentAt: string;
  linked: boolean;
  createdAt: string;
  deletedAt?: string;
};

export type RefundRequest = {
  id: string;
  orderId: string;
  ownerUid: string;
  reason: string;
  status: "requested" | "rejected" | "refunded" | "manual_pending";
  requestedAt: string;
  reviewer?: string;
  resolution?: string;
};

export type AnalyticsEventName =
  | "test_started"
  | "test_completed"
  | "summary_viewed"
  | "checkout_started"
  | "payment_verified"
  | "report_opened"
  | "refund_requested"
  | "recommendation_used";

export type AnalyticsEvent = {
  id: string;
  name: AnalyticsEventName;
  product?: string;
  sessionId?: string;
  orderId?: string;
  userId: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actorId: string;
  role: UserRole;
  action: string;
  target: string;
  reason?: string;
  createdAt: string;
};

export type LedgerEntry = {
  id: string;
  type: "revenue" | "refund" | "paid_cogs" | "unpaid_sunk" | "retry_cogs";
  orderId?: string;
  jobId?: string;
  amountMnt?: number;
  costUsd?: number;
  costMnt?: number | null;
  ownerRef: string;
  createdAt: string;
};

export type EmailDelivery = {
  key: string;
  to: string;
  status: "sent" | "skipped";
  createdAt: string;
};

export type HelpContact = {
  name: string;
  phone: string;
  note: string;
  source: string;
};

export type SiteConfig = {
  appName: string;
  helpContacts: HelpContact[];
  funCopy: Record<string, { title: string; summary: string }>;
};

export type VersionOverride = {
  versionId: string;
  status: VersionStatus;
  translationReview: "none" | "reviewed";
  licenseRef: string | null;
};

export type StylePackage = {
  sessionId: string;
  directionIds: string[];
  recommendations: unknown;
  starterOutfits: { item: string; note: string }[];
  imagePaths: string[];
  deliveredDirectionIds: string[];
};

export type StoredObject = {
  bytes: Buffer;
  contentType: string;
};
