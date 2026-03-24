import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { internalError } from "@/lib/server/http/responses";
import { listGoogleAccountsByWorkspace } from "@/lib/server/integrations/google-connections-repo";
import { toPublicGoogleAccount } from "@/lib/server/integrations/google-oauth";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    if (session instanceof Response) {
      return session;
    }

    const accounts = await listGoogleAccountsByWorkspace(session.workspaceId);
    return NextResponse.json({ accounts: accounts.map(toPublicGoogleAccount) }, { status: 200 });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/integrations/google/accounts", action: "GET" });
    return internalError();
  }
}
