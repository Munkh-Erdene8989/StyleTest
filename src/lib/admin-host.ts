export const ADMIN_HOST = "admin.naruka.mn";

export function isAdminHost(host: string | null | undefined) {
  const value = (host || "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
  return value === ADMIN_HOST;
}

export function adminResetOrigin(req: Request) {
  const forwarded = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const host = forwarded.split(",")[0]?.trim() ?? "";
  if (isAdminHost(host) || host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : req.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  return `https://${ADMIN_HOST}`;
}
