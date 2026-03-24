import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { getWorkflowFormMapping } from "@/lib/server/forms/form-sync";
import { badRequest, internalError } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    if (session instanceof Response) {
      return session;
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
