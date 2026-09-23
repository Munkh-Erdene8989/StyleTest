import { sanitizeEvent } from "@/domain/events";
import type { AnalyticsEventName } from "@/domain/types";
import { iso } from "@/domain/time";
import { getStore } from "./store";

export async function recordOnce(
  id: string,
  input: { name: AnalyticsEventName; userId: string; product?: string; sessionId?: string; orderId?: string },
) {
  const store = getStore();
  if (await store.getEvent(id)) return;
  await store.saveEvent(
    sanitizeEvent({
      id,
      createdAt: iso(),
      ...input,
    }),
  );
}
