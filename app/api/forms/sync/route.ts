import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { syncFormForWorkflow } from "@/lib/server/forms/form-sync";
import { badRequest, internalError, ok } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    if (session instanceof Response) {
      return session;
    }

    const body = (await request.json()) as { workflowId?: string; googleFormId?: string };
    if (!body.workflowId || !body.googleFormId) {
      return badRequest("workflowId and googleFormId are required", "VALIDATION_ERROR");
    }

    const result = await syncFormForWorkflow({
      workspaceId: session.workspaceId,
      workflowId: body.workflowId,
      googleFormId: body.googleFormId
    });

    return ok(result);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/forms/sync", action: "POST" });
    return internalError();
  }
}
