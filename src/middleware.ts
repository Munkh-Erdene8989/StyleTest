import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminHost } from "@/lib/admin-host";

export function middleware(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!isAdminHost(host)) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = request.cookies.get("sa_uid") ? "/admin" : "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
