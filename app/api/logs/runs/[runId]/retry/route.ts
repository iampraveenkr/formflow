import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { trackError } from "@/lib/observability/error-tracking";
import { getWorkflowRun } from "@/lib/server/db/formflow-repo";
import { findWorkflow } from "@/lib/server/db/workflows/repo";
import { internalError, notFound, ok, unauthorized } from "@/lib/server/http/responses";
import { retryWorkflowRun } from "@/services/workflows/run-orchestrator";
import { NextResponse } from "next/server";

interface Params { params: Promise<{ runId: string }>; }

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    const { runId } = await params;
    if (!session?.workspaceId) return unauthorized();

    const run = await getWorkflowRun(runId);
    if (!run || run.workspaceId !== session.workspaceId) return notFound();

    const workflow = await findWorkflow(session.workspaceId, run.workflowId);
    if (!workflow) return notFound("Workflow not found");

    const body = (await request.json()) as { submission?: Record<string, unknown> };
    const outcome = await retryWorkflowRun({ workspaceId: session.workspaceId, run, workflow, submissionOverride: body.submission });

    return ok(outcome);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/logs/runs/[runId]/retry", action: "POST" });
    return internalError();
  }
}
