import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { faceQuestions } from "@/content/quizzes/face-beauty";
import { STYLE_QUIZ_PRICE_MNT } from "@/domain/money";
import type { User } from "@/domain/types";
import { createAiQuizCheckout, readAiQuiz, simulateAiQuiz } from "./ai-quiz-service";
import { sendEmail } from "./email";
import { createInvoice } from "./qpay";
import { getStore, resetStoreForTests } from "./store";

vi.mock("./email", () => ({
  sendEmail: vi.fn(async () => ({ skipped: false })),
}));

vi.mock("./face-report-pdf", () => ({
  ensureQuizReportPdf: vi.fn(async () => Buffer.from("%PDF-1.4")),
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
    expect(paid.quiz.brief?.sections.length).toBeGreaterThan(0);
    await vi.waitFor(async () => {
      expect((await getStore().getAiQuiz(created.id))?.reportStatus).toBe("sent");
    });
    const stored = await getStore().getAiQuiz(created.id);
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

  it("asks for the delivery email on the quiz", async () => {
    await expect(createAiQuizCheckout(user, { kind: "face_beauty", answers: faceAnswers(), email: "" })).rejects.toMatchObject({
      code: "invalid_contact",
    });
  });
});
