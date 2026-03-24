import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { trackError } from "@/lib/observability/error-tracking";
import { getWorkflowRun, listWorkflowRunLogs, listWorkflowRunSteps } from "@/lib/server/db/formflow-repo";
import { internalError, notFound, ok, unauthorized } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

interface Params { params: Promise<{ runId: string }>; }

export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    const { runId } = await params;
    if (!session?.workspaceId) return unauthorized();

    const run = await getWorkflowRun(runId);
    if (!run || run.workspaceId !== session.workspaceId) return notFound();

    const url = new URL(request.url);
    const steps = await listWorkflowRunSteps(runId, {
      actionType: url.searchParams.get("actionType") ?? undefined,
      status: url.searchParams.get("stepStatus") ?? undefined
    });
    const logs = await listWorkflowRunLogs(runId);

    return ok({ run, steps, logs });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/logs/runs/[runId]", action: "GET" });
    return internalError();
  }
}
