import { createHash } from "crypto";

export function stableId(parts: string[]) {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}
