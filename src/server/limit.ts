import { AppError } from "@/domain/errors";
import { DAY_MS } from "@/domain/time";
import { getStore } from "./store";

export async function limit(userId: string, action: string, max: number, windowMs = DAY_MS) {
  const allowed = await getStore().bumpRate(`${userId}:${action}`, max, windowMs, Date.now());
  if (!allowed) throw new AppError("rate_limited", 429);
}
