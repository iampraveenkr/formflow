import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { syncFormForWorkflow } from "@/lib/server/forms/form-sync";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { workflowId?: string; googleFormId?: string };
  if (!body.workflowId || !body.googleFormId) {
    return NextResponse.json({ error: "workflowId and googleFormId are required" }, { status: 400 });
  }

  const result = await syncFormForWorkflow({
    workspaceId: session.workspaceId,
    workflowId: body.workflowId,
    googleFormId: body.googleFormId
  });

  return NextResponse.json(result, { status: 200 });
}
