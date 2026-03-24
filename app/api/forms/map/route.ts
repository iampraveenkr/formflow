import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { trackError } from "@/lib/observability/error-tracking";
import { updateWorkflowFieldMapping } from "@/lib/server/forms/form-sync";
import { badRequest, internalError, notFound, ok, unauthorized } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session?.workspaceId) {
      return unauthorized();
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
