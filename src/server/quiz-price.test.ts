import { beforeEach, describe, expect, it } from "vitest";
import { QUIZ_PRICE_MIN_MESSAGE, STYLE_QUIZ_PRICE_MNT } from "@/domain/money";
import { updateSite } from "./admin-service";
import { blankUser } from "./auth";
import { currentQuizPrice } from "./quiz-price";
import { createStyleQuizCheckout } from "./style-quiz-service";
import { resetStoreForTests } from "./store";

describe("quiz price", () => {
  beforeEach(() => {
    resetStoreForTests();
    process.env.QPAY_SIMULATE = "true";
    delete process.env.QPAY_BASE_URL;
  });

  it("charges the price saved from the admin desk", async () => {
    expect(await currentQuizPrice()).toBe(STYLE_QUIZ_PRICE_MNT);
    const ops = { ...blankUser("ops_price"), role: "ops" as const, anonymous: false };
    await updateSite(ops, { quizPriceMnt: "4900" });
    expect(await currentQuizPrice()).toBe(4900);
    const quiz = await createStyleQuizCheckout({
      name: "Сараа",
      email: "saraa@example.com",
      answers: { undertone: { value: "warm", label: "Дулаан", insight: "Дулаан өнгө зохино." } },
    });
    expect(quiz.amount).toBe(4900);
    expect(quiz.paymentStatus).toBe("invoiced");
  });

  it("rejects zero and any price under 100", async () => {
    const ops = { ...blankUser("ops_price"), role: "ops" as const };
    await expect(updateSite(ops, { quizPriceMnt: 0 })).rejects.toMatchObject({
      code: "invalid_price",
      issues: [QUIZ_PRICE_MIN_MESSAGE],
    });
    await expect(updateSite(ops, { quizPriceMnt: 99 })).rejects.toMatchObject({
      code: "invalid_price",
      issues: [QUIZ_PRICE_MIN_MESSAGE],
    });
    await expect(updateSite(ops, { quizPriceMnt: 5_000_001 })).rejects.toMatchObject({ code: "invalid_price" });
    await updateSite(ops, { quizPriceMnt: 100 });
    expect(await currentQuizPrice()).toBe(100);
  });
});
