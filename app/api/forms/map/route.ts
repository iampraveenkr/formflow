import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { updateWorkflowFieldMapping } from "@/lib/server/forms/form-sync";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    formId?: string;
    externalFieldId?: string;
    internalFieldKey?: string;
  };

  if (!body.formId || !body.externalFieldId || !body.internalFieldKey) {
    return NextResponse.json({ error: "formId, externalFieldId and internalFieldKey are required" }, { status: 400 });
  }

  const fields = await updateWorkflowFieldMapping({
    formId: body.formId,
    externalFieldId: body.externalFieldId,
    internalFieldKey: body.internalFieldKey
  });

  return NextResponse.json({ fields }, { status: 200 });
}
