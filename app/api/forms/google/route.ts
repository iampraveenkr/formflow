import { listAccessibleGoogleForms } from "@/lib/server/forms/google-forms";
import { trackError } from "@/lib/observability/error-tracking";
import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { internalError, unauthorized } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session?.workspaceId) {
      return unauthorized();
    }

    const forms = await listAccessibleGoogleForms();
    return NextResponse.json({ forms }, { status: 200 });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/forms/google", action: "GET" });
    return internalError();
  }
}
