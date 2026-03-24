import { listAccessibleGoogleForms } from "@/lib/server/forms/google-forms";
import { trackError } from "@/lib/observability/error-tracking";
import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { internalError } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    if (session instanceof Response) {
      return session;
    }

    const forms = await listAccessibleGoogleForms();
    return NextResponse.json({ forms }, { status: 200 });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/forms/google", action: "GET" });
    return internalError();
  }
}
