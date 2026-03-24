import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { buildSessionCookie, createSessionToken } from "@/lib/server/auth/session";
import { getWorkspaceById, updateWorkspaceOnboardingStatus } from "@/lib/server/db/workspace-repo";
import { NextResponse } from "next/server";

interface OnboardingRequestBody {
  workspaceName: string;
  businessName: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session || !session.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as OnboardingRequestBody;
  if (!body.workspaceName || !body.businessName) {
    return NextResponse.json({ error: "workspaceName and businessName are required" }, { status: 400 });
  }

  const workspace = await getWorkspaceById(session.workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  workspace.name = body.workspaceName;
  await updateWorkspaceOnboardingStatus(workspace.id, "complete");

  const updatedToken = createSessionToken({
    userId: session.userId,
    email: session.email,
    workspaceId: workspace.id,
    onboardingComplete: true
  });

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.headers.set("Set-Cookie", buildSessionCookie(updatedToken));
  return response;
}
