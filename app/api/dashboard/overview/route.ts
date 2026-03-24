import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { listWorkflowRunsByWorkspace, searchWorkflowRunLogs } from "@/lib/server/db/formflow-repo";
import { listWorkflows } from "@/lib/server/db/workflows/repo";
import { listGoogleAccountsByWorkspace } from "@/lib/server/integrations/google-connections-repo";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const [workflows, runs, integrations, errors] = await Promise.all([
    listWorkflows(session.workspaceId),
    listWorkflowRunsByWorkspace(session.workspaceId),
    listGoogleAccountsByWorkspace(session.workspaceId),
    searchWorkflowRunLogs(session.workspaceId, { query: "failed" })
  ]);

  const activeWorkflows = workflows.filter((workflow) => workflow.status === "active").length;
  const recentRuns = runs.slice(0, 6);
  const successfulRuns = runs.filter((run) => run.status === "success").length;
  const successRate = runs.length === 0 ? 0 : Math.round((successfulRuns / runs.length) * 100);

  return NextResponse.json(
    {
      ok: true,
      data: {
        activeWorkflows,
        recentRuns,
        successRate,
        connectedIntegrations: integrations.length,
        latestErrors: errors.slice(0, 6)
      }
    },
    { status: 200 }
  );
}
