import { listAccessibleGoogleForms } from "@/lib/server/forms/google-forms";
import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forms = await listAccessibleGoogleForms();
  return NextResponse.json({ forms }, { status: 200 });
}
