import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { exchangeOAuthCodeForGoogleConnection } from "@/lib/server/integrations/google-oauth";
import { upsertGoogleAccount } from "@/lib/server/integrations/google-connections-repo";
import { isOAuthStateValid } from "@/services/integrations/state";
import { NextResponse } from "next/server";

function readCookieValue(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }

  for (const cookieChunk of header.split(";")) {
    const [cookieName, ...rest] = cookieChunk.trim().split("=");
    if (cookieName === name) {
      return rest.join("=");
    }
  }

  return null;
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = requireWorkspaceSession(request);
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (session instanceof Response) {
    return NextResponse.redirect(`${url.origin}/login`);
  }

  const expectedState = readCookieValue(request.headers.get("cookie"), "formflow_google_connect_state");
  if (!isOAuthStateValid(expectedState, state)) {
    return NextResponse.redirect(`${url.origin}/integrations?error=invalid_state`);
  }

  if (error) {
    return NextResponse.redirect(`${url.origin}/integrations?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/integrations?error=missing_code`);
  }

  try {
    const account = await exchangeOAuthCodeForGoogleConnection({
      code,
      workspaceId: session.workspaceId,
      userId: session.userId
    });

    await upsertGoogleAccount(account);
    const response = NextResponse.redirect(`${url.origin}/integrations?success=connected`);
    response.headers.set("Set-Cookie", "formflow_google_connect_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    return response;
  } catch {
    return NextResponse.redirect(`${url.origin}/integrations?error=oauth_failed`);
  }
}
