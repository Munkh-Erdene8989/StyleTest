import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STYLE_QUIZ_PRICE_MNT } from "@/domain/money";
import { createStyleQuizCheckout, simulateStyleQuiz } from "./style-quiz-service";
import { getStore, resetStoreForTests } from "./store";

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

describe("style quiz checkout", () => {
  const saved = {
    simulate: process.env.QPAY_SIMULATE,
    base: process.env.QPAY_BASE_URL,
    openai: process.env.OPENAI_API_KEY,
    resend: process.env.RESEND_API_KEY,
  };

  beforeEach(() => {
    resetStoreForTests();
    process.env.QPAY_SIMULATE = "true";
    delete process.env.QPAY_BASE_URL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    restore("QPAY_SIMULATE", saved.simulate);
    restore("QPAY_BASE_URL", saved.base);
    restore("OPENAI_API_KEY", saved.openai);
    restore("RESEND_API_KEY", saved.resend);
  });

  it("charges 150 and emails a report after payment", async () => {
    const quiz = await createStyleQuizCheckout({
      name: "Сараа",
      email: "saraa@example.com",
      answers: {
        undertone: { value: "warm", label: "Дулаан", insight: "Дулаан өнгө зохино." },
        preference: { value: "classic", label: "Классик", insight: "Цэвэр шугам." },
      },
    });
    expect(quiz.amount).toBe(STYLE_QUIZ_PRICE_MNT);
    expect(quiz.amount).toBe(150);
    expect(quiz.paymentStatus).toBe("invoiced");
    expect(quiz.simulate).toBe(true);
    expect((await getStore().getStyleQuiz(quiz.id))?.reportStatus).toBe("pending");
    const paid = await simulateStyleQuiz(quiz.id);
    expect(paid.quiz.paymentStatus).toBe("paid");
    await vi.waitFor(async () => {
      expect((await getStore().getStyleQuiz(quiz.id))?.reportStatus).toBe("sent");
    });
    expect((await getStore().getStyleQuiz(quiz.id))?.email).toBe("saraa@example.com");
  });
});
