import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { findGoogleAccountById } from "@/lib/server/integrations/google-connections-repo";
import { refreshGoogleAccessToken } from "@/lib/server/integrations/google-oauth";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { accountId?: string };
  if (!body.accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  const account = await findGoogleAccountById(body.accountId);
  if (!account || account.workspaceId !== session.workspaceId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await refreshGoogleAccessToken(account.id);
  return NextResponse.json({ ok: true }, { status: 200 });
}
