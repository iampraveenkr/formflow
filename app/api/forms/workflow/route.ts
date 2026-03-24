import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { getWorkflowFormMapping } from "@/lib/server/forms/form-sync";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workflowId = url.searchParams.get("workflowId");
  if (!workflowId) {
    return NextResponse.json({ error: "workflowId is required" }, { status: 400 });
  }

  const mapping = await getWorkflowFormMapping({ workspaceId: session.workspaceId, workflowId });
  return NextResponse.json(mapping, { status: 200 });
}
