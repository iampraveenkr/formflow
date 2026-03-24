import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { getWorkflowRun, getWorkflowRunStep } from "@/lib/server/db/formflow-repo";
import { findWorkflow } from "@/lib/server/db/workflows/repo";
import { internalError, notFound, ok } from "@/lib/server/http/responses";
import { retryWorkflowStep } from "@/services/workflows/run-orchestrator";
import { NextResponse } from "next/server";

interface Params { params: Promise<{ runId: string; stepId: string }>; }

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    const { runId, stepId } = await params;
    if (session instanceof Response) return session;

    const run = await getWorkflowRun(runId);
    const step = await getWorkflowRunStep(stepId);
    if (!run || !step || run.workspaceId !== session.workspaceId || step.runId !== runId) {
      return notFound();
    }

    const workflow = await findWorkflow(session.workspaceId, run.workflowId);
    if (!workflow) return notFound("Workflow not found");

    const body = (await request.json()) as { submission?: Record<string, unknown> };
    const outcome = await retryWorkflowStep({ workspaceId: session.workspaceId, workflow, run, step, submission: body.submission ?? run.inputPayload });
    return ok(outcome);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/logs/runs/[runId]/steps/[stepId]/retry", action: "POST" });
    return internalError();
  }
}
