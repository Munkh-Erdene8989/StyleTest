import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { faceQuestions } from "@/content/quizzes/face-beauty";
import { STYLE_QUIZ_PRICE_MNT } from "@/domain/money";
import type { User } from "@/domain/types";
import { publicQuestions } from "./ai-quiz-banks";
import { blankUser } from "./auth";
import { createAiQuizCheckout, readAiQuiz, saveQuizPhoto, simulateAiQuiz } from "./ai-quiz-service";
import { loadProfile } from "./profile-service";
import { sendEmail } from "./email";
import { createInvoice } from "./qpay";
import { getStore, resetStoreForTests } from "./store";

vi.mock("./email", () => ({
  sendEmail: vi.fn(async () => ({ skipped: false })),
}));

vi.mock("./face-report-pdf", () => ({
  ensureQuizReportPdf: vi.fn(async () => ({
    pdf: Buffer.from("%PDF-1.4"),
    brief: { title: "Нүүр ба гоо сайхан", status: "ready", sections: [{ heading: "Чиглэл", body: "Нэг өгүүлбэр." }] },
    detail: { summary: "Нэг өгүүлбэр.", sections: [{ heading: "Чиглэл", body: "Нэг өгүүлбэр." }] },
  })),
}));

vi.mock("./qpay", () => ({
  createInvoice: vi.fn(async () => ({ invoiceId: "inv_ai", qrImage: undefined, urls: [] })),
  checkInvoice: vi.fn(async () => ({ paid: true, amount: 150, currency: "MNT", paymentId: "pay_ai", channel: "other" })),
  simulatePayAllowed: () => true,
}));

const user: User = {
  id: "user_ai",
  email: "saraa@example.com",
  dateOfBirth: null,
  ageBand: "unknown",
  anonymous: false,
  role: "user",
  createdAt: "2026-10-02T00:00:00.000Z",
};

function faceAnswers() {
  return Object.fromEntries(faceQuestions.map((question) => [question.id, { type: "single", optionId: question.options[0]?.id }]));
}

describe("ai quiz checkout", () => {
  const saved = process.env.OPENAI_API_KEY;

  beforeEach(async () => {
    resetStoreForTests();
    await getStore().saveUser(user);
    vi.mocked(sendEmail).mockClear();
    vi.mocked(createInvoice).mockClear();
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (saved === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = saved;
    vi.unstubAllGlobals();
  });

  it("hides the brief until payment, then emails the detailed report once", async () => {
    const created = await createAiQuizCheckout({ ...user, email: null }, {
      kind: "face_beauty",
      answers: faceAnswers(),
      email: "saraa@example.com",
    });
    expect(created.amount).toBe(STYLE_QUIZ_PRICE_MNT);
    expect(created.paymentStatus).toBe("invoiced");
    expect(created.brief).toBeNull();
    expect((await readAiQuiz(user, created.id)).brief).toBeNull();
    expect(createInvoice).toHaveBeenCalledTimes(1);
    expect(sendEmail).not.toHaveBeenCalled();

    const paid = await simulateAiQuiz(user, created.id);
    expect(paid.quiz.paymentStatus).toBe("paid");
    await vi.waitFor(async () => {
      expect((await getStore().getAiQuiz(created.id))?.reportStatus).toBe("sent");
    });
    const stored = await getStore().getAiQuiz(created.id);
    expect(stored?.brief?.sections.length).toBeGreaterThan(0);
    expect(stored?.detail?.sections.length).toBeGreaterThan(0);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({ filename: "naruka-face_beauty-report.pdf" })],
    }));
    expect(stored?.email).toBe("saraa@example.com");
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const again = await simulateAiQuiz(user, created.id);
    expect(again.duplicate).toBe(true);
    expect(createInvoice).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("keeps a consented quiz photo and rejects one without consent", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    await expect(saveQuizPhoto(user, { role: "face", bytes: png, contentType: "image/png", consent: false })).rejects.toMatchObject({
      code: "consent_required",
    });
    const photo = await saveQuizPhoto(user, { role: "face", bytes: png, contentType: "image/png", consent: true });
    const created = await createAiQuizCheckout(user, {
      kind: "face_beauty",
      answers: faceAnswers(),
      email: "saraa@example.com",
      photoId: photo.id,
    });
    expect((await getStore().getAiQuiz(created.id))?.photoUploadId).toBe(photo.id);
    const bodyPhoto = await saveQuizPhoto(user, { role: "body", bytes: png, contentType: "image/png", consent: true });
    await expect(createAiQuizCheckout(user, {
      kind: "face_beauty",
      answers: faceAnswers(),
      email: "saraa@example.com",
      photoId: bodyPhoto.id,
    })).rejects.toMatchObject({ code: "invalid_image" });
    const archetypeAnswers = Object.fromEntries(
      publicQuestions("archetype").map((question) => [question.id, { type: "single" as const, optionId: question.options?.[0]?.id ?? "" }]),
    );
    const styled = await createAiQuizCheckout(user, {
      kind: "archetype",
      answers: archetypeAnswers,
      email: "saraa@example.com",
      photoId: bodyPhoto.id,
    });
    expect((await getStore().getAiQuiz(styled.id))?.photoUploadId).toBe(bodyPhoto.id);
    await expect(createAiQuizCheckout(user, {
      kind: "archetype",
      answers: archetypeAnswers,
      email: "saraa@example.com",
      photoId: photo.id,
    })).rejects.toMatchObject({ code: "invalid_image" });
  });

  it("writes the delivery email and face shape onto the account", async () => {
    const guest = blankUser("guest_quiz");
    await getStore().saveUser(guest);
    const created = await createAiQuizCheckout(guest, {
      kind: "face_beauty",
      answers: faceAnswers(),
      email: "guest@example.com",
    });
    expect(created.accountId).toBe(guest.id);
    const saved = await getStore().getUser(guest.id);
    expect(saved?.email).toBe("guest@example.com");
    expect(saved?.faceShape).toBeTruthy();
    expect((await loadProfile(saved!)).faceShape).toBe(saved?.faceShape);
  });

  it("asks for the delivery email on the quiz", async () => {
    await expect(createAiQuizCheckout(user, { kind: "face_beauty", answers: faceAnswers(), email: "" })).rejects.toMatchObject({
      code: "invalid_contact",
    });
  });
});
