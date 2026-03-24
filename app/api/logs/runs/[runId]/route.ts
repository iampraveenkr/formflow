import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { getWorkflowRun, listWorkflowRunLogs, listWorkflowRunSteps } from "@/lib/server/db/formflow-repo";
import { NextResponse } from "next/server";

interface Params { params: Promise<{ runId: string }>; }

export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  const { runId } = await params;
  if (!session?.workspaceId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const run = await getWorkflowRun(runId);
  if (!run || run.workspaceId !== session.workspaceId) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const url = new URL(request.url);
  const steps = await listWorkflowRunSteps(runId, {
    actionType: url.searchParams.get("actionType") ?? undefined,
    status: url.searchParams.get("stepStatus") ?? undefined
  });
  const logs = await listWorkflowRunLogs(runId);

  return NextResponse.json({ ok: true, data: { run, steps, logs } }, { status: 200 });
}
