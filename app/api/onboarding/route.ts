import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { buildSessionCookie, createSessionToken } from "@/lib/server/auth/session";
import { getWorkspaceById, updateWorkspaceOnboardingStatus } from "@/lib/server/db/workspace-repo";
import { badRequest, internalError, notFound, ok } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

interface OnboardingRequestBody {
  workspaceName: string;
  businessName: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    if (session instanceof Response) {
      return session;
    }

    const body = (await request.json()) as OnboardingRequestBody;
    const workspaceName = body.workspaceName?.trim();
    const businessName = body.businessName?.trim();
    if (!workspaceName || !businessName) {
      return badRequest("workspaceName and businessName are required", "VALIDATION_ERROR");
    }
    if (workspaceName.length > 80 || businessName.length > 120) {
      return badRequest("workspaceName or businessName exceeds the max length", "VALIDATION_ERROR");
    }

    const workspace = await getWorkspaceById(session.workspaceId);
    if (!workspace) {
      return notFound("Workspace not found");
    }

    workspace.name = workspaceName;
    await updateWorkspaceOnboardingStatus(workspace.id, "complete");

    const updatedToken = createSessionToken({
      userId: session.userId,
      email: session.email,
      workspaceId: workspace.id,
      onboardingComplete: true
    });

    const response = ok({ onboardingComplete: true });
    response.headers.set("Set-Cookie", buildSessionCookie(updatedToken));
    return response;
  } catch (error) {
    trackError(error, { area: "api", route: "/api/onboarding", action: "POST" });
    return internalError();
  }
}
