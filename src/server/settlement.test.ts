import { beforeEach, describe, expect, it, vi } from "vitest";
import { faceQuestions } from "@/content/quizzes/face-beauty";
import type { AiQuizRecord } from "@/domain/ai-quiz";
import type { StyleQuizRecord } from "@/domain/style-quiz";
import type { Order } from "@/domain/types";
import { checkInvoice } from "./qpay";
import { receivePaymentCallback } from "./settlement";
import { getStore, resetStoreForTests } from "./store";

vi.mock("./qpay", () => ({
  checkInvoice: vi.fn(),
  createInvoice: vi.fn(),
  qpayConfigured: () => false,
  refundCardPayment: vi.fn(),
  simulatePayAllowed: () => false,
}));

const paid = (invoiceId: string, amount: number) => ({
  paid: true,
  amount,
  currency: "MNT",
  paymentId: `pay_${invoiceId}`,
  channel: "card" as const,
});

describe("payment settlement", () => {
  beforeEach(() => {
    resetStoreForTests();
    vi.mocked(checkInvoice).mockReset();
  });

  it("settles an Order, a Style quiz, and an AI quiz through one callback", async () => {
    vi.mocked(checkInvoice).mockImplementation(async (invoiceId: string) => {
      if (invoiceId === "inv_order") return paid(invoiceId, 9900);
      return paid(invoiceId, 150);
    });
    await getStore().saveOrder(order("ord_1", "inv_order"));
    await getStore().saveStyleQuiz(styleQuiz("quiz_1", "inv_style"));
    await getStore().saveAiQuiz(aiQuiz("aiq_1", "inv_ai"));

    const first = await receivePaymentCallback({ invoice_id: "inv_order" });
    const style = await receivePaymentCallback({ invoice_id: "inv_style" });
    const ai = await receivePaymentCallback({ sender_invoice_no: "aiq_1" });
    const again = await receivePaymentCallback({ invoice_id: "inv_order" });

    expect(first).toEqual({ ok: true, duplicate: false });
    expect(style).toEqual({ ok: true, duplicate: false });
    expect(ai).toEqual({ ok: true, duplicate: false });
    expect(again).toEqual({ ok: true, duplicate: true });
    expect((await getStore().getOrder("ord_1"))?.paymentStatus).toBe("paid");
    expect((await getStore().getStyleQuiz("quiz_1"))?.paymentStatus).toBe("paid");
    const storedAi = await getStore().getAiQuiz("aiq_1");
    expect(storedAi?.paymentStatus).toBe("paid");
    expect(storedAi?.brief?.sections.length).toBeGreaterThan(0);
    expect((await getStore().listLedger()).filter((entry) => entry.type === "revenue")).toHaveLength(1);
    expect(await getStore().getEntitlement("ent_ord_1")).toBeTruthy();
    expect((await getStore().listAudit()).some((row) => row.action === "payment_rejected")).toBe(false);
  });

  it("rejects a mismatched Order without settling the other invoices", async () => {
    vi.mocked(checkInvoice).mockResolvedValue(paid("inv_order", 1));
    await getStore().saveOrder(order("ord_1", "inv_order"));
    await getStore().saveStyleQuiz(styleQuiz("quiz_1", "inv_style"));

    const result = await receivePaymentCallback({ object_id: "inv_order" });

    expect(result).toEqual({ ok: true, duplicate: false });
    expect((await getStore().getOrder("ord_1"))?.paymentStatus).toBe("invoiced");
    expect((await getStore().getStyleQuiz("quiz_1"))?.paymentStatus).toBe("invoiced");
    expect((await getStore().listAudit()).map((row) => row.reason)).toEqual(["amount_mismatch"]);
  });

  it("returns not_found when no Invoice matches", async () => {
    await expect(receivePaymentCallback({ invoice_id: "missing" })).rejects.toMatchObject({ code: "not_found" });
    expect(checkInvoice).not.toHaveBeenCalled();
  });
});

function order(id: string, invoiceId: string): Order {
  return {
    id,
    ownerUid: "user_1",
    productCode: "personality_report",
    amount: 9900,
    currency: "MNT",
    sessionId: "ses_1",
    reportId: "",
    paymentStatus: "invoiced",
    qpayInvoiceId: invoiceId,
    channel: "unknown",
    urls: [],
    createdAt: "2026-10-03T00:00:00.000Z",
  };
}

function styleQuiz(id: string, invoiceId: string): StyleQuizRecord {
  return {
    id,
    name: "Сараа",
    email: "saraa@example.com",
    answers: { undertone: { value: "warm", label: "Дулаан", insight: "Дулаан өнгө зохино." } },
    amount: 150,
    currency: "MNT",
    paymentStatus: "invoiced",
    qpayInvoiceId: invoiceId,
    urls: [],
    reportStatus: "pending",
    createdAt: "2026-10-03T00:00:00.000Z",
  };
}

function aiQuiz(id: string, invoiceId: string): AiQuizRecord {
  return {
    id,
    kind: "face_beauty",
    ownerUid: "user_1",
    email: "saraa@example.com",
    answers: Object.fromEntries(faceQuestions.map((question) => [question.id, { type: "single" as const, optionId: question.options[0]?.id ?? "" }])),
    amount: 150,
    currency: "MNT",
    paymentStatus: "invoiced",
    qpayInvoiceId: invoiceId,
    urls: [],
    brief: null,
    detail: null,
    reportStatus: "pending",
    createdAt: "2026-10-03T00:00:00.000Z",
  };
}
