import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { decideAuthPageRedirect, decideProtectedRouteRedirect } from "@/services/auth/guards";

export function middleware(request: NextRequest): NextResponse {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  const { pathname } = request.nextUrl;

  const protectedDecision = decideProtectedRouteRedirect(pathname, session);
  if (!protectedDecision.allow && protectedDecision.redirectTo) {
    return NextResponse.redirect(new URL(protectedDecision.redirectTo, request.url));
  }

  const authPageDecision = decideAuthPageRedirect(pathname, session);
  if (!authPageDecision.allow && authPageDecision.redirectTo) {
    return NextResponse.redirect(new URL(authPageDecision.redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/workflows/:path*", "/integrations/:path*", "/logs/:path*", "/billing/:path*", "/settings/:path*", "/login", "/onboarding"]
};
