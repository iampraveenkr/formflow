import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { trackError } from "@/lib/observability/error-tracking";
import { getWorkflowFormMapping } from "@/lib/server/forms/form-sync";
import { badRequest, internalError, unauthorized } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session?.workspaceId) {
      return unauthorized();
    }

    const body = (await request.json()) as { workflowId?: string };
    if (!body.workflowId) {
      return badRequest("workflowId is required", "VALIDATION_ERROR");
    }

    const mapping = await getWorkflowFormMapping({ workspaceId: session.workspaceId, workflowId: body.workflowId });
    return NextResponse.json({ previewPayload: mapping.previewPayload }, { status: 200 });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/forms/preview", action: "POST" });
    return internalError();
  }
}
