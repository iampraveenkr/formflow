import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { getWorkflowRun } from "@/lib/server/db/formflow-repo";
import { findWorkflow } from "@/lib/server/db/workflows/repo";
import { retryWorkflowRun } from "@/services/workflows/run-orchestrator";
import { NextResponse } from "next/server";

interface Params { params: Promise<{ runId: string }>; }

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  const { runId } = await params;
  if (!session?.workspaceId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const run = await getWorkflowRun(runId);
  if (!run || run.workspaceId !== session.workspaceId) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const workflow = await findWorkflow(session.workspaceId, run.workflowId);
  if (!workflow) return NextResponse.json({ ok: false, error: "Workflow not found" }, { status: 404 });

  const body = (await request.json()) as { submission?: Record<string, unknown> };
  const outcome = await retryWorkflowRun({ workspaceId: session.workspaceId, run, workflow, submissionOverride: body.submission });

  return NextResponse.json({ ok: true, data: outcome }, { status: 200 });
}
