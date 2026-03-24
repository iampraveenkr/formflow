import { randomUUID } from "node:crypto";
import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { buildGoogleConnectionOAuthUrl } from "@/lib/server/integrations/google-oauth";
import { listGoogleAccountsByWorkspace } from "@/lib/server/integrations/google-connections-repo";
import { enforceAccountConnectionLimit } from "@/services/billing/enforcement";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }


  const accounts = await listGoogleAccountsByWorkspace(session.workspaceId);
  const gate = await enforceAccountConnectionLimit(session.workspaceId, accounts.length);
  if (!gate.allowed) {
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(gate.reason ?? "Plan limit reached")}`, request.url));
  }

  const state = randomUUID();
  const redirectUrl = buildGoogleConnectionOAuthUrl(state);
  const response = NextResponse.redirect(redirectUrl);
  response.headers.set("Set-Cookie", `formflow_google_connect_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return response;
}
