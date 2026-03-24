import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { getWorkflowRun, getWorkflowRunStep } from "@/lib/server/db/formflow-repo";
import { findWorkflow } from "@/lib/server/db/workflows/repo";
import { retryWorkflowStep } from "@/services/workflows/run-orchestrator";
import { NextResponse } from "next/server";

interface Params { params: Promise<{ runId: string; stepId: string }>; }

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  const { runId, stepId } = await params;
  if (!session?.workspaceId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const run = await getWorkflowRun(runId);
  const step = await getWorkflowRunStep(stepId);
  if (!run || !step || run.workspaceId !== session.workspaceId || step.runId !== runId) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const workflow = await findWorkflow(session.workspaceId, run.workflowId);
  if (!workflow) return NextResponse.json({ ok: false, error: "Workflow not found" }, { status: 404 });

  const body = (await request.json()) as { submission?: Record<string, unknown> };
  const outcome = await retryWorkflowStep({ workspaceId: session.workspaceId, workflow, run, step, submission: body.submission ?? run.inputPayload });
  return NextResponse.json({ ok: true, data: outcome }, { status: 200 });
}
