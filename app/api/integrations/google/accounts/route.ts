import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { listGoogleAccountsByWorkspace } from "@/lib/server/integrations/google-connections-repo";
import { toPublicGoogleAccount } from "@/lib/server/integrations/google-oauth";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await listGoogleAccountsByWorkspace(session.workspaceId);
  return NextResponse.json({ accounts: accounts.map(toPublicGoogleAccount) }, { status: 200 });
}
