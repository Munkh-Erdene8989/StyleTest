import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { providers } from "./ai";
import { attachEmail, blankUser } from "./auth";
import { deleteAccount, deleteOriginalPhotos, runRetention } from "./account-service";
import { updateVersion } from "./admin-service";
import { addonEligibility, applyObservation, createOrder, requestRefund, reviewRefund } from "./order-service";
import { present } from "./result-service";
import { completeQuiz, createQuizSession, saveQuizAnswers, saveStyleUpload } from "./session-service";
import { resetStoreForTests } from "./store";
import { getStore } from "./store";
import { processJobById } from "./worker";
import { getVersion, STYLE_DIRECTIONS } from "@/domain/content";
import { PRICES } from "@/domain/money";
import { imageFormatOk } from "@/domain/images";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("product flow", () => {
  const originalExplain = providers.explainPersonality;

  beforeEach(() => {
    resetStoreForTests();
    process.env.QPAY_SIMULATE = "true";
    delete process.env.QPAY_BASE_URL;
    delete process.env.OPENAI_API_KEY;
    providers.explainPersonality = originalExplain;
  });

  afterEach(() => {
    providers.explainPersonality = originalExplain;
  });

  it("isolates users, hides unpaid reports, and grants once", async () => {
    const adult = await adultUser();
    const other = await adultUser();
    const session = await answerPersonality(adult.id);
    await processJobById((await getStore().getReport(`rep_${session.id}`))!.generationJobId!);
    await expect(present(other, `rep_${session.id}`)).rejects.toMatchObject({ code: "not_found" });
    const locked = await present(adult, `rep_${session.id}`);
    expect(locked.fullContent).toBeUndefined();
    expect(locked.assets).toBeUndefined();
    expect(locked.priceMnt).toBe(PRICES.personality_report);
    const buyer = await attachEmail(adult.id, "buyer@example.com");
    const order = await createOrder(buyer, { sessionId: session.id, productCode: "personality_report" });
    const bad = await applyObservation(order.id, { paid: true, amount: 100, currency: "MNT", paymentId: "bad", channel: "card" });
    expect(bad.reason).toBe("amount_mismatch");
    expect((await present(buyer, `rep_${session.id}`)).entitlementStatus).toBe("locked");
    const paid = await applyObservation(order.id, { paid: true, amount: PRICES.personality_report, currency: "MNT", paymentId: "pay-1", channel: "card" });
    const again = await applyObservation(order.id, { paid: true, amount: PRICES.personality_report, currency: "MNT", paymentId: "pay-1", channel: "card" });
    expect(paid.reason).toBe("paid");
    expect(again.duplicate).toBe(true);
    const open = await present(buyer, `rep_${session.id}`);
    expect(open.entitlementStatus).toBe("active");
    expect(open.fullContent).toBeTruthy();
    const events = await getStore().listEvents();
    expect(events.map((event) => event.name)).toEqual(
      expect.arrayContaining(["test_started", "test_completed", "summary_viewed", "checkout_started", "payment_verified", "report_opened"]),
    );
    expect(JSON.stringify(events)).not.toContain("Шинэ ажил");
    expect((await getStore().listLedger()).filter((entry) => entry.type === "revenue")).toHaveLength(1);
    expect(await getStore().getEmail(`report:${order.id}`)).toBeTruthy();
  });

  it("retries generation without a new purchase", async () => {
    const adult = await adultUser();
    let calls = 0;
    providers.explainPersonality = async () => {
      calls += 1;
      if (calls === 1) throw new Error("schema_invalid");
      return {
        draft: {
          source: "template",
          sections: [
            { heading: "Зан төлөвийн тайлбар", body: "а" },
            { heading: "Давуу тал", body: "б" },
            { heading: "Анзаарах хэв маяг", body: "в" },
            { heading: "Өдөр тутмын жишээ", body: "г" },
          ],
        },
        costUsd: 0.01,
      };
    };
    const session = await answerPersonality(adult.id);
    const jobId = (await getStore().getReport(`rep_${session.id}`))!.generationJobId!;
    await processJobById(jobId);
    expect((await getStore().getJob(jobId))?.status).toBe("pending");
    await processJobById(jobId);
    const job = await getStore().getJob(jobId);
    expect(job?.status).toBe("ready");
    expect(job?.billablePurchaseId).toBeNull();
    expect(await getStore().listOrders()).toHaveLength(0);
  });

  it("keeps the same job when a guest session moves to an account", async () => {
    const guest = await adultUser();
    const session = await answerPersonality(guest.id);
    const jobId = (await getStore().getReport(`rep_${session.id}`))!.generationJobId!;
    const account = blankUser();
    account.email = "owner@example.com";
    account.anonymous = false;
    await getStore().saveUser(account);
    const { moveOwnership } = await import("./auth");
    await moveOwnership(guest.id, account.id);
    expect((await getStore().getSession(session.id))?.ownerUid).toBe(account.id);
    expect((await getStore().getJob(jobId))?.id).toBe(jobId);
    expect(await getStore().listJobs()).toHaveLength(1);
  });

  it("closes adult stress and paid products for minors", async () => {
    const child = blankUser();
    child.ageBand = "under18";
    child.dateOfBirth = "2015-01-01";
    await getStore().saveUser(child);
    await expect(createQuizSession(child, "stress")).rejects.toMatchObject({ code: "age_restricted" });
    await expect(createQuizSession(child, "personality")).rejects.toMatchObject({ code: "age_restricted" });
    const fun = await createQuizSession(child, "fun");
    expect(fun.versionId).toBe("fun-demo-v1");
  });

  it("does not auto-refund a non-card payment", async () => {
    const adult = await attachEmail((await adultUser()).id, "refund@example.com");
    const session = await answerPersonality(adult.id);
    await processJobById((await getStore().getReport(`rep_${session.id}`))!.generationJobId!);
    const order = await createOrder(adult, { sessionId: session.id, productCode: "personality_report" });
    await applyObservation(order.id, { paid: true, amount: PRICES.personality_report, currency: "MNT", paymentId: "bank-1", channel: "bank_qr" });
    const refund = await requestRefund(adult, order.id, "Бодол өөрчлөгдсөн");
    const calls: string[] = [];
    const review = await reviewRefund(adultAdmin(), refund.id, "approve", {
      refundCard: async (paymentId) => {
        calls.push(paymentId);
      },
    });
    expect(review.manual).toBe(true);
    expect(calls).toEqual([]);
    expect((await present(adult, `rep_${session.id}`)).entitlementStatus).toBe("active");
  });

  it("revokes a card refund and keeps the ledger", async () => {
    const adult = await attachEmail((await adultUser()).id, "card@example.com");
    const session = await answerPersonality(adult.id);
    await processJobById((await getStore().getReport(`rep_${session.id}`))!.generationJobId!);
    const order = await createOrder(adult, { sessionId: session.id, productCode: "personality_report" });
    await applyObservation(order.id, { paid: true, amount: PRICES.personality_report, currency: "MNT", paymentId: "card-1", channel: "card" });
    const refund = await requestRefund(adult, order.id, "Тайлбар тохироогүй");
    await reviewRefund(adultAdmin(), refund.id, "approve", { refundCard: async () => undefined });
    expect((await present(adult, `rep_${session.id}`)).entitlementStatus).toBe("revoked");
    expect((await present(adult, `rep_${session.id}`)).fullContent).toBeUndefined();
    expect((await getStore().listLedger()).some((entry) => entry.type === "refund")).toBe(true);
  });

  it("separates original photo deletion from account deletion", async () => {
    const adult = await adultUser();
    const session = await answerPersonality(adult.id);
    expect(imageFormatOk(PNG, "image/png")).toBe(true);
    await saveStyleUpload(adult, (await styleReady(adult.id)).id, "face", PNG, "image/png", true).catch(() => undefined);
    const store = getStore();
    await store.putObject("private/report.png", PNG, "image/png");
    const report = await store.getReport(`rep_${session.id}`);
    report!.assetPaths = ["private/report.png"];
    await store.saveReport(report!);
    await store.saveUpload({
      id: "face-1",
      ownerUid: adult.id,
      sessionId: session.id,
      role: "face",
      path: "private/face.png",
      contentType: "image/png",
      consentAt: new Date().toISOString(),
      linked: true,
      createdAt: new Date().toISOString(),
    });
    await store.putObject("private/face.png", PNG, "image/png");
    await deleteOriginalPhotos(adult);
    expect(await store.getObject("private/face.png")).toBeNull();
    expect(await store.getObject("private/report.png")).toBeTruthy();
    await deleteAccount(adult);
    expect(await store.getReport(`rep_${session.id}`)).toBeNull();
    expect((await store.listOrders()).every((order) => order.ownerUid.startsWith("deleted:"))).toBe(true);
  });

  it("blocks a new addon direction that duplicates the package", async () => {
    const adult = await attachEmail((await adultUser()).id, "style@example.com");
    const session = await styleReady(adult.id);
    await processJobById((await getStore().getReport(`rep_${session.id}`))!.generationJobId!);
    expect(await addonEligibility(adult, session.id)).toEqual({ eligible: false });
    const order = await createOrder(adult, { sessionId: session.id, productCode: "style_package" });
    await applyObservation(order.id, { paid: true, amount: PRICES.style_package, currency: "MNT", paymentId: "style-1", channel: "other" });
    const open = await addonEligibility(adult, session.id);
    if (open.eligible) {
      expect(STYLE_DIRECTIONS.some((item) => item.id === open.directionId)).toBe(true);
      const pkg = await getStore().getStylePackage(session.id);
      pkg!.deliveredDirectionIds = STYLE_DIRECTIONS.map((item) => item.id);
      await getStore().saveStylePackage(pkg!);
      expect(await addonEligibility(adult, session.id)).toEqual({ eligible: false });
    }
  });

  it("refuses to mark stress approved without a verified help contact", async () => {
    const admin = adultAdmin();
    await expect(
      updateVersion(admin, {
        versionId: "stress-demo-v1",
        status: "approved",
        translationReview: "reviewed",
        licenseRef: "license-1",
      }),
    ).rejects.toMatchObject({ code: "help_contacts_required" });
    expect(getVersion("stress-demo-v1").status).toBe("demo");
  });

  it("drops unpaid assets after the retention window", async () => {
    const adult = await adultUser();
    const session = await answerPersonality(adult.id);
    const report = (await getStore().getReport(`rep_${session.id}`))!;
    report.expiresAt = "2020-01-01T00:00:00.000Z";
    report.assetPaths = ["private/expired.png"];
    report.fullContent = { hidden: true };
    await getStore().saveReport(report);
    await getStore().putObject("private/expired.png", PNG, "image/png");
    await runRetention(new Date("2026-09-24T00:00:00Z"));
    const saved = await getStore().getReport(report.id);
    expect(saved?.fullContent).toBeNull();
    expect(saved?.assetPaths).toEqual([]);
    expect(await getStore().getObject("private/expired.png")).toBeNull();
  });
});

async function adultUser() {
  const user = blankUser();
  user.ageBand = "adult";
  user.dateOfBirth = "1990-01-01";
  await getStore().saveUser(user);
  return user;
}

function adultAdmin() {
  const user = blankUser();
  user.role = "ops_sensitive";
  user.email = "admin@example.com";
  user.ageBand = "adult";
  user.anonymous = false;
  return user;
}

async function answerPersonality(userId: string) {
  const user = (await getStore().getUser(userId))!;
  const session = await createQuizSession(user, "personality");
  const version = getVersion(session.versionId);
  const answers = Object.fromEntries(version.questions.map((question) => [question.id, "a"]));
  await saveQuizAnswers(user, session.id, answers);
  await completeQuiz(user, session.id);
  return session;
}

async function styleReady(userId: string) {
  const user = (await getStore().getUser(userId))!;
  const { createStyleSession, saveStyleInput, completeStyle } = await import("./session-service");
  const session = await createStyleSession(user);
  await saveStyleInput(user, session.id, {
    likedIds: ["ex-warm-knit", "ex-earth-layer", "ex-mono-tee"],
    aspireIds: ["ex-soft-trouser"],
    dislikedIds: [],
    lifestyle: "home",
    comfort: "сул ноосон",
    request: "өдөр тутмын",
    usePersonality: false,
  });
  await saveStyleUpload(user, session.id, "face", PNG, "image/png", true);
  await saveStyleUpload(user, session.id, "body", PNG, "image/png", true);
  await completeStyle(user, session.id);
  return session;
}
