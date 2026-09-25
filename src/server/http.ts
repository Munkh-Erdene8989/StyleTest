import { AppError } from "@/domain/errors";
import { assertAppCheck, currentUser } from "./auth";
import type { User } from "@/domain/types";

export function errorResponse(error: unknown) {
  if (error instanceof AppError) return Response.json({ error: error.code }, { status: error.status });
  const detail = error instanceof Error ? error.message : "unknown";
  console.error("request_failed", detail.slice(0, 180));
  return Response.json({ error: "server_error" }, { status: 500 });
}

export async function withUser(req: Request, fn: (user: User) => Promise<Response>) {
  try {
    await assertAppCheck(req);
    const user = await currentUser(req);
    return await fn(user);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function readJson(req: Request) {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
