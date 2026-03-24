import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { searchWorkflowRunLogs } from "@/lib/server/db/formflow-repo";
import { internalError } from "@/lib/server/http/responses";
import { hasAdvancedLogsAccess } from "@/services/billing/enforcement";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    if (session instanceof Response) return session;

    const url = new URL(request.url);
    const advancedLogs = await hasAdvancedLogsAccess(session.workspaceId);
    const logs = await searchWorkflowRunLogs(session.workspaceId, {
      workflowId: advancedLogs ? url.searchParams.get("workflowId") ?? undefined : undefined,
      status: advancedLogs ? url.searchParams.get("status") ?? undefined : undefined,
      actionType: advancedLogs ? url.searchParams.get("actionType") ?? undefined : undefined,
      dateFrom: url.searchParams.get("dateFrom") ?? undefined,
      dateTo: url.searchParams.get("dateTo") ?? undefined,
      query: url.searchParams.get("q") ?? undefined
    });

    const data = advancedLogs ? logs : logs.slice(0, 20);
    return NextResponse.json({ ok: true, data, meta: { advancedLogs } }, { status: 200 });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/logs", action: "GET" });
    return internalError();
  }
}
