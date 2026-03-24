import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { trackError } from "@/lib/observability/error-tracking";
import { listWorkflowRunsByWorkspace, searchWorkflowRunLogs } from "@/lib/server/db/formflow-repo";
import { listWorkflows } from "@/lib/server/db/workflows/repo";
import { listGoogleAccountsByWorkspace } from "@/lib/server/integrations/google-connections-repo";
import { internalError, ok, unauthorized } from "@/lib/server/http/responses";
import { resolveWorkspacePlan } from "@/services/billing/enforcement";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session?.workspaceId) return unauthorized();

    const [workflows, runs, integrations, errors, billing] = await Promise.all([
      listWorkflows(session.workspaceId),
      listWorkflowRunsByWorkspace(session.workspaceId),
      listGoogleAccountsByWorkspace(session.workspaceId),
      searchWorkflowRunLogs(session.workspaceId, { query: "failed" }),
      resolveWorkspacePlan(session.workspaceId)
    ]);

    const activeWorkflows = workflows.filter((workflow) => workflow.status === "active").length;
    const recentRuns = runs.slice(0, 6);
    const successfulRuns = runs.filter((run) => run.status === "success").length;
    const successRate = runs.length === 0 ? 0 : Math.round((successfulRuns / runs.length) * 100);

    return ok({
      activeWorkflows,
      recentRuns,
      successRate,
      connectedIntegrations: integrations.length,
      latestErrors: errors.slice(0, 6),
      currentPlan: billing.plan.name
    });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/dashboard/overview", action: "GET" });
    return internalError();
  }
}
