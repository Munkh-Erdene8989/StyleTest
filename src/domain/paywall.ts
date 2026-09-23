import type { Entitlement, HelpContact, Report, VersionStatus } from "./types";

export type PublicResult = {
  sessionId: string;
  reportId: string;
  kind: string;
  versionId: string;
  versionStatus: VersionStatus;
  demo: boolean;
  summary: { title: string; body: string; disclaimer?: string };
  outline: string[];
  priceMnt: number;
  jobStatus: string | null;
  entitlementStatus: "locked" | "unlocking" | "active" | "revoked" | "free";
  expiresAt?: string;
  fullContent?: unknown;
  assets?: { url: string }[];
  helpContacts: HelpContact[];
};

export function projectResult(input: {
  report: Report;
  entitlement: Entitlement | null;
  jobStatus: string | null;
  versionStatus: VersionStatus;
  helpContacts: HelpContact[];
  assets?: { url: string }[];
}): PublicResult {
  const free = input.report.priceMnt === 0;
  const status = free ? "free" : (input.entitlement?.status ?? "locked");
  const reveal = free || status === "active";
  const view: PublicResult = {
    sessionId: input.report.sessionId,
    reportId: input.report.id,
    kind: input.report.kind,
    versionId: input.report.versionId,
    versionStatus: input.versionStatus,
    demo: input.versionStatus === "demo",
    summary: input.report.summary,
    outline: input.report.outline,
    priceMnt: input.report.priceMnt,
    jobStatus: input.jobStatus,
    entitlementStatus: status,
    expiresAt: input.report.expiresAt,
    helpContacts: input.helpContacts,
  };
  if (reveal) {
    view.fullContent = input.report.fullContent;
    if (input.assets && input.assets.length > 0) view.assets = input.assets;
  }
  return view;
}
