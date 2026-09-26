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
    summary: {
      title: withoutModelNames(input.report.summary.title),
      body: withoutModelNames(input.report.summary.body),
      disclaimer: input.report.summary.disclaimer ? withoutModelNames(input.report.summary.disclaimer) : undefined,
    },
    outline: input.report.outline.map(withoutModelNames),
    priceMnt: input.report.priceMnt,
    jobStatus: input.jobStatus,
    entitlementStatus: status,
    expiresAt: input.report.expiresAt,
    helpContacts: input.helpContacts,
  };
  if (reveal) {
    view.fullContent = input.report.fullContent;
    if (input.assets && input.assets.length > 0) view.assets = input.assets;
  } else if (status === "locked") {
    const preview = previewContent(input.report.fullContent);
    if (preview) view.fullContent = preview;
  }
  return view;
}

export function withoutModelNames(text: string) {
  return text
    .replace(/хиймэл оюуны?(?:\s*\(AI\))?/gi, "")
    .replace(/\(\s*AI\s*\)/gi, "")
    .replace(/\bAI\b/gi, "")
    .replace(/\bClaude\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.:])/g, "$1")
    .trim();
}

const PREVIEW_RATIO = 0.6;

export function previewContent(content: unknown) {
  if (!content || typeof content !== "object" || !("sections" in content)) return undefined;
  const sections = (content as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return undefined;
  const blocks = sections.filter(isSection);
  if (blocks.length === 0) return undefined;
  const bodies = sliceText(blocks.map((section) => section.body), PREVIEW_RATIO);
  return {
    sections: blocks.slice(0, bodies.length).map((section, index) => ({
      heading: section.heading,
      body: bodies[index],
    })),
  };
}

function isSection(value: unknown): value is { heading: string; body: string } {
  return Boolean(value && typeof value === "object" && "heading" in value && "body" in value && typeof value.heading === "string" && typeof value.body === "string");
}

function sliceText(blocks: string[], ratio: number) {
  const total = blocks.reduce((sum, block) => sum + block.length, 0);
  if (total === 0) return blocks.slice(0, 1);
  const budget = Math.max(1, Math.ceil(total * ratio));
  const out: string[] = [];
  let used = 0;
  for (const block of blocks) {
    if (used >= budget) break;
    const room = budget - used;
    if (block.length <= room) {
      out.push(block);
      used += block.length;
    } else {
      out.push(cut(block, room));
      break;
    }
  }
  return out;
}

function cut(text: string, room: number) {
  const slice = text.slice(0, room);
  const space = slice.lastIndexOf(" ");
  const trimmed = space > room * 0.6 ? slice.slice(0, space) : slice;
  return `${trimmed.trimEnd()}…`;
}
