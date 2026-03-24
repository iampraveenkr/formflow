import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { trackError } from "@/lib/observability/error-tracking";
import { internalError, unauthorized } from "@/lib/server/http/responses";
import { listGoogleAccountsByWorkspace } from "@/lib/server/integrations/google-connections-repo";
import { toPublicGoogleAccount } from "@/lib/server/integrations/google-oauth";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session?.workspaceId) {
      return unauthorized();
    }

    const accounts = await listGoogleAccountsByWorkspace(session.workspaceId);
    return NextResponse.json({ accounts: accounts.map(toPublicGoogleAccount) }, { status: 200 });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/integrations/google/accounts", action: "GET" });
    return internalError();
  }
}
