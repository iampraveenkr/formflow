import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { trackError } from "@/lib/observability/error-tracking";
import { listWorkflows } from "@/lib/server/db/workflows/repo";
import { listGoogleAccountsByWorkspace } from "@/lib/server/integrations/google-connections-repo";
import { internalError, ok, unauthorized } from "@/lib/server/http/responses";
import { getBillingSummary } from "@/services/billing/enforcement";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session?.workspaceId) return unauthorized();

    const [workflows, accounts] = await Promise.all([
      listWorkflows(session.workspaceId),
      listGoogleAccountsByWorkspace(session.workspaceId)
    ]);

    const summary = await getBillingSummary(session.workspaceId, {
      workflows: workflows.length,
      connectedAccounts: accounts.length
    });

    return ok(summary);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/billing/summary", action: "GET" });
    return internalError();
  }
}
