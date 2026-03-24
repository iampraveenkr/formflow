import { buildSessionCookie, createSessionToken } from "@/lib/server/auth/session";
import { exchangeCodeForUser } from "@/lib/server/auth/google";
import {
  createWorkspaceForOwner,
  ensureOwnerMembership,
  listMembershipsByUserId,
  upsertUser,
  getWorkspaceById
} from "@/lib/server/db/workspace-repo";
import { decideBootstrapActions } from "@/services/workspace/bootstrap";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${url.origin}/oauth-error?reason=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/login?error=missing_code`);
  }

  try {
    const user = await exchangeCodeForUser(code);
    await upsertUser(user);

    const memberships = await listMembershipsByUserId(user.id);
    const firstWorkspace = memberships.length > 0 ? await getWorkspaceById(memberships[0].workspaceId) : null;

    const actions = decideBootstrapActions({
      user,
      existingMemberships: memberships,
      existingWorkspace: firstWorkspace
    });

    let workspace = firstWorkspace;
    if (actions.createWorkspace) {
      workspace = await createWorkspaceForOwner({
        name: "My Workspace",
        ownerUserId: user.id,
        onboardingStatus: "pending"
      });
    }

    if (workspace && actions.createOwnerMembership) {
      await ensureOwnerMembership(workspace.id, user.id);
    }

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      workspaceId: workspace?.id ?? null,
      onboardingComplete: workspace?.onboardingStatus === "complete"
    });

    const destination = workspace?.onboardingStatus === "complete" ? "/dashboard" : "/onboarding";
    const response = NextResponse.redirect(`${url.origin}${destination}`);
    response.headers.set("Set-Cookie", buildSessionCookie(token));
    return response;
  } catch {
    return NextResponse.redirect(`${url.origin}/login?error=oauth_failed`);
  }
}
