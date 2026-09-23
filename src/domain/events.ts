import type { AnalyticsEvent, AnalyticsEventName } from "./types";

const NAMES: AnalyticsEventName[] = [
  "test_started",
  "test_completed",
  "summary_viewed",
  "checkout_started",
  "payment_verified",
  "report_opened",
  "refund_requested",
  "recommendation_used",
];

export function sanitizeEvent(input: {
  id: string;
  name: string;
  product?: string;
  sessionId?: string;
  orderId?: string;
  userId: string;
  createdAt: string;
  extra?: unknown;
}): AnalyticsEvent {
  if (!NAMES.includes(input.name as AnalyticsEventName)) {
    throw new Error("event_not_allowed");
  }
  return {
    id: input.id,
    name: input.name as AnalyticsEventName,
    product: input.product,
    sessionId: input.sessionId,
    orderId: input.orderId,
    userId: input.userId,
    createdAt: input.createdAt,
  };
}
