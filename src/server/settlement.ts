import { AppError } from "@/domain/errors";
import { verifyObservation, type ObservedPayment } from "@/domain/payment";
import { iso } from "@/domain/time";
import type { PayChannel } from "@/domain/types";
import { checkInvoice } from "./qpay";
import { getStore } from "./store";

export type Payable = {
  id: string;
  amount: number;
  currency: string;
  paymentStatus: string;
};

export type PaymentStamp = {
  qpayPaymentId?: string;
  channel: PayChannel;
  paidAt: string;
};

export type Settlement<T extends Payable> = {
  duplicate: boolean;
  record: T;
  reason: string;
};

type PayableHit = {
  kind: "order" | "style" | "ai";
  id: string;
  qpayInvoiceId: string;
};

export async function settlePayment<T extends Payable>(
  current: T,
  observed: ObservedPayment,
  book: {
    commit: (stamp: PaymentStamp) => Promise<{ previous: T; next: T }>;
    afterPaid?: (record: T) => Promise<void> | void;
    afterDuplicate?: (record: T) => Promise<void> | void;
    afterRejected?: (reason: string) => Promise<void> | void;
  },
): Promise<Settlement<T>> {
  if (current.paymentStatus === "paid") {
    await book.afterDuplicate?.(current);
    return { duplicate: true, record: current, reason: "duplicate" };
  }
  const verdict = verifyObservation(current, observed);
  if (!verdict.ok) {
    if (verdict.reason !== "unpaid") await book.afterRejected?.(verdict.reason);
    return { duplicate: false, record: current, reason: verdict.reason };
  }
  const stamp: PaymentStamp = {
    qpayPaymentId: observed.paymentId ?? undefined,
    channel: observed.channel,
    paidAt: iso(),
  };
  const { previous, next } = await book.commit(stamp);
  if (previous.paymentStatus === "paid") {
    await book.afterDuplicate?.(next);
    return { duplicate: true, record: next, reason: "duplicate" };
  }
  await book.afterPaid?.(next);
  return { duplicate: false, record: next, reason: "paid" };
}

export async function receivePaymentCallback(body: Record<string, unknown>, queryInvoice?: string) {
  const invoiceId = stringValue(body.invoice_id) || stringValue(body.object_id) || queryInvoice || "";
  const sender = stringValue(body.sender_invoice_no);
  const hit = await locatePayable(invoiceId, sender);
  if (!hit) throw new AppError("not_found", 404);
  const observed = await checkInvoice(hit.qpayInvoiceId);
  const result = await settleHit(hit, observed);
  return { ok: true as const, duplicate: result.duplicate };
}

async function settleHit(hit: PayableHit, observed: ObservedPayment) {
  if (hit.kind === "order") {
    const { applyObservation } = await import("./order-service");
    return applyObservation(hit.id, observed);
  }
  if (hit.kind === "style") {
    const { applyStyleQuizObservation } = await import("./style-quiz-service");
    return applyStyleQuizObservation(hit.id, observed);
  }
  const { applyAiQuizObservation } = await import("./ai-quiz-service");
  return applyAiQuizObservation(hit.id, observed);
}

async function locatePayable(invoiceId: string, sender: string): Promise<PayableHit | null> {
  const store = getStore();
  if (invoiceId) {
    const order = await store.findOrderByInvoice(invoiceId);
    if (order?.qpayInvoiceId) return { kind: "order", id: order.id, qpayInvoiceId: order.qpayInvoiceId };
    const style = await store.findStyleQuizByInvoice(invoiceId);
    if (style?.qpayInvoiceId) return { kind: "style", id: style.id, qpayInvoiceId: style.qpayInvoiceId };
    const ai = await store.findAiQuizByInvoice(invoiceId);
    if (ai?.qpayInvoiceId) return { kind: "ai", id: ai.id, qpayInvoiceId: ai.qpayInvoiceId };
    return null;
  }
  if (!sender) return null;
  const order = await store.getOrder(sender);
  if (order?.qpayInvoiceId) return { kind: "order", id: order.id, qpayInvoiceId: order.qpayInvoiceId };
  const style = await store.getStyleQuiz(sender);
  if (style?.qpayInvoiceId) return { kind: "style", id: style.id, qpayInvoiceId: style.qpayInvoiceId };
  if (!sender.startsWith("aiq_")) return null;
  const ai = await store.getAiQuiz(sender);
  if (ai?.qpayInvoiceId) return { kind: "ai", id: ai.id, qpayInvoiceId: ai.qpayInvoiceId };
  return null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
