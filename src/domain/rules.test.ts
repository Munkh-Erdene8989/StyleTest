import { describe, expect, it } from "vitest";
import { ageBandFromDob, canStartTest } from "./age";
import { accountDeletion, originalPhotoDeletion } from "./deletion";
import { sanitizeEvent } from "./events";
import { verifyObservation } from "./payment";
import { projectResult } from "./paywall";
import { retentionPlan } from "./retention";
import { scoreAnswers } from "./score";
import { isNearDuplicate, rankDirections } from "./style-match";
import { getVersion, STYLE_DIRECTIONS, STYLE_EXAMPLES } from "./content";
import type { Report, Session, Upload } from "./types";

describe("scoring", () => {
  it("keeps a stable band for the same answers and version", () => {
    const version = getVersion("personality-demo-v1");
    const answers = Object.fromEntries(version.questions.map((question) => [question.id, "a"]));
    const first = scoreAnswers(version, answers);
    const second = scoreAnswers(version, answers);
    expect(first).toEqual(second);
    expect(first.computedBy).toBe("deterministic");
    expect(first.bandId).toBe("spark");
    expect(first.versionId).toBe("personality-demo-v1");
  });
});

describe("age gate", () => {
  it("blocks paid and adult stress flows for minors", () => {
    expect(ageBandFromDob("2015-05-01", new Date("2026-09-24T00:00:00Z"))).toBe("under18");
    expect(canStartTest("stress", "under18")).toBe(false);
    expect(canStartTest("personality", "under18")).toBe(false);
    expect(canStartTest("style", "under18")).toBe(false);
    expect(canStartTest("fun", "under18")).toBe(true);
    expect(canStartTest("youth", "under18")).toBe(true);
    expect(canStartTest("youth", "adult")).toBe(false);
  });
});

describe("style match", () => {
  it("skips disliked and near-duplicate directions without a fake percentage", () => {
    const liked = rankDirections({
      directions: STYLE_DIRECTIONS,
      examples: STYLE_EXAMPLES,
      likedIds: ["ex-warm-knit"],
      aspireIds: [],
      dislikedIds: ["ex-contrast-jacket"],
      lifestyle: "home",
      delivered: [],
      limit: 8,
    });
    expect(liked.some((item) => item.id === "clear-line")).toBe(false);
    const delivered = liked[0];
    const next = rankDirections({
      directions: STYLE_DIRECTIONS,
      examples: STYLE_EXAMPLES,
      likedIds: ["ex-warm-knit"],
      aspireIds: [],
      dislikedIds: [],
      lifestyle: "mixed",
      delivered: [delivered],
      limit: 8,
    });
    expect(next.some((item) => isNearDuplicate(item, delivered))).toBe(false);
  });
});

describe("paywall", () => {
  it("omits the full report and asset urls until the entitlement is active", () => {
    const report = baseReport();
    const locked = projectResult({
      report,
      entitlement: null,
      jobStatus: "ready",
      versionStatus: "demo",
      helpContacts: [],
      assets: [{ url: "https://private.example/secret" }],
    });
    expect(locked.fullContent).toBeUndefined();
    expect(locked.assets).toBeUndefined();
    expect(JSON.stringify(locked)).not.toContain("secret");
    const open = projectResult({
      report,
      entitlement: {
        id: "ent",
        ownerUid: "u",
        orderId: "o",
        targetId: report.id,
        status: "active",
      },
      jobStatus: "ready",
      versionStatus: "demo",
      helpContacts: [],
      assets: [{ url: "/api/media/token" }],
    });
    expect(open.fullContent).toEqual({ secret: true });
    expect(open.assets?.[0].url).toBe("/api/media/token");
  });
});

describe("payment check", () => {
  it("rejects a mismatched amount", () => {
    expect(verifyObservation({ amount: 9900, currency: "MNT" }, { paid: true, amount: 1000, currency: "MNT", paymentId: "p", channel: "card" }).ok).toBe(false);
  });
});

describe("retention and deletion", () => {
  it("expires guest sessions and unpaid assets on different clocks", () => {
    const now = new Date("2026-09-24T00:00:00Z");
    const old = new Date("2026-08-01T00:00:00Z").toISOString();
    const plan = retentionPlan({
      now,
      sessions: [
        { ...session("s1"), createdAt: old, status: "in_progress", anonymousOwner: true },
        { ...session("s2"), createdAt: now.toISOString(), status: "in_progress", anonymousOwner: true },
      ],
      reports: [{ ...baseReport(), id: "r", sessionId: "s3", expiresAt: old, assetPaths: ["private/a.png"], priceMnt: 9900 }],
      uploads: [{ ...upload("up"), linked: false, createdAt: old }],
      orders: [],
    });
    expect(plan.sessionIds).toContain("s1");
    expect(plan.sessionIds).not.toContain("s2");
    expect(plan.reportIds).toContain("r");
    expect(plan.uploadIds).toEqual(["up"]);
  });

  it("deletes original photos without deleting purchased report assets", () => {
    const photos = originalPhotoDeletion([upload("face"), { ...upload("body"), id: "body", role: "body", path: "private/body" }]);
    expect(photos.paths).toEqual(["private/face", "private/body"]);
    const account = accountDeletion({
      userId: "u",
      sessions: [session("s")],
      reports: [baseReport()],
      uploads: [upload("face")],
      entitlements: [],
    });
    expect(account.reportIds).toEqual(["rep"]);
    expect(account.paths).toContain("private/report.png");
  });
});

describe("analytics", () => {
  it("drops fields outside the allowlist", () => {
    const event = sanitizeEvent({
      id: "e",
      name: "test_started",
      userId: "u",
      createdAt: "2026-09-24T00:00:00Z",
      extra: { answers: "secret" },
    });
    expect(event).not.toHaveProperty("extra");
    expect(JSON.stringify(event)).not.toContain("secret");
  });
});

function session(id: string): Session {
  return {
    id,
    ownerUid: "u",
    kind: "fun",
    testId: "fun-demo",
    versionId: "fun-demo-v1",
    answers: {},
    status: "in_progress",
    anonymousOwner: true,
    createdAt: "2026-09-24T00:00:00Z",
    updatedAt: "2026-09-24T00:00:00Z",
    expiresAt: "2026-10-08T00:00:00Z",
  };
}

function baseReport(): Report {
  return {
    id: "rep",
    sessionId: "s",
    ownerUid: "u",
    versionId: "personality-demo-v1",
    kind: "personality",
    summary: { title: "Товч", body: "Богино" },
    outline: ["Зан төлөвийн тайлбар"],
    fullContent: { secret: true },
    assetPaths: ["private/report.png"],
    priceMnt: 9900,
    createdAt: "2026-09-24T00:00:00Z",
  };
}

function upload(id: string): Upload {
  return {
    id,
    ownerUid: "u",
    sessionId: "s",
    role: "face",
    path: "private/face",
    contentType: "image/png",
    consentAt: "2026-09-24T00:00:00Z",
    linked: true,
    createdAt: "2026-09-01T00:00:00Z",
  };
}
