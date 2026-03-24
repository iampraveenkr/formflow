import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { searchWorkflowRunLogs } from "@/lib/server/db/formflow-repo";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const logs = await searchWorkflowRunLogs(session.workspaceId, {
    workflowId: url.searchParams.get("workflowId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    actionType: url.searchParams.get("actionType") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    query: url.searchParams.get("q") ?? undefined
  });

  return NextResponse.json({ ok: true, data: logs }, { status: 200 });
}
