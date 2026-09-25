import type { EntitlementStatus, GenerationJob, Order, PayChannel } from "./types";

export type ObservedPayment = {
  paid: boolean;
  amount: number | null;
  currency: string | null;
  paymentId: string | null;
  channel: PayChannel;
};

export function verifyObservation(order: Pick<Order, "amount" | "currency">, observed: ObservedPayment) {
  if (!observed.paid) return { ok: false as const, reason: "unpaid" };
  if (observed.amount === null || observed.currency === null || !observed.paymentId) {
    return { ok: false as const, reason: "unconfirmed" };
  }
  if (observed.amount !== order.amount) return { ok: false as const, reason: "amount_mismatch" };
  if (observed.currency !== order.currency) return { ok: false as const, reason: "currency_mismatch" };
  return { ok: true as const };
}

export function entitlementAfterPayment(job: Pick<GenerationJob, "status"> | null): EntitlementStatus {
  return job?.status === "ready" ? "active" : "unlocking";
}

export function qpayRefundSupported(channel: PayChannel) {
  return channel === "card";
}

export function refundWindowOpen(paidAt: string, now: Date) {
  return now.getTime() - new Date(paidAt).getTime() <= 24 * 60 * 60 * 1000;
}
