import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { getWorkflowFormMapping } from "@/lib/server/forms/form-sync";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { workflowId?: string };
  if (!body.workflowId) {
    return NextResponse.json({ error: "workflowId is required" }, { status: 400 });
  }

  const mapping = await getWorkflowFormMapping({ workspaceId: session.workspaceId, workflowId: body.workflowId });
  return NextResponse.json({ previewPayload: mapping.previewPayload }, { status: 200 });
}
