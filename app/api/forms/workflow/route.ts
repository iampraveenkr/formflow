import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { trackError } from "@/lib/observability/error-tracking";
import { getWorkflowFormMapping } from "@/lib/server/forms/form-sync";
import { badRequest, internalError, unauthorized } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session?.workspaceId) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const workflowId = url.searchParams.get("workflowId");
    if (!workflowId) {
      return badRequest("workflowId is required", "VALIDATION_ERROR");
    }

    const mapping = await getWorkflowFormMapping({ workspaceId: session.workspaceId, workflowId });
    return NextResponse.json(mapping, { status: 200 });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/forms/workflow", action: "GET" });
    return internalError();
  }
}
