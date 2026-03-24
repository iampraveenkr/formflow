import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { updateWorkflowFieldMapping } from "@/lib/server/forms/form-sync";
import { badRequest, internalError, notFound, ok } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    if (session instanceof Response) {
      return session;
    }

    const body = (await request.json()) as {
      formId?: string;
      externalFieldId?: string;
      internalFieldKey?: string;
    };

    if (!body.formId || !body.externalFieldId || !body.internalFieldKey) {
      return badRequest("formId, externalFieldId and internalFieldKey are required", "VALIDATION_ERROR");
    }

    const fields = await updateWorkflowFieldMapping({
      workspaceId: session.workspaceId,
      formId: body.formId,
      externalFieldId: body.externalFieldId,
      internalFieldKey: body.internalFieldKey
    });

    if (!fields) {
      return notFound("Form or field mapping target not found");
    }

    return ok({ fields });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/forms/map", action: "POST" });
    return internalError();
  }
}
