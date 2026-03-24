import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { findGoogleAccountById, removeGoogleAccount } from "@/lib/server/integrations/google-connections-repo";
import { badRequest, internalError, notFound, ok } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    if (session instanceof Response) {
      return session;
    }

    const body = (await request.json()) as { accountId?: string };
    if (!body.accountId) {
      return badRequest("accountId is required", "VALIDATION_ERROR");
    }

    const account = await findGoogleAccountById(body.accountId);
    if (!account || account.workspaceId !== session.workspaceId) {
      return notFound();
    }

    await removeGoogleAccount(account.id);
    return ok({ disconnected: true });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/integrations/google/disconnect", action: "POST" });
    return internalError();
  }
}
