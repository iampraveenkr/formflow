import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { duplicateWorkflow } from "@/lib/server/db/workflows/repo";
import { internalError, notFound, ok } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    const { id } = await params;

    if (session instanceof Response) return session;

    const duplicated = await duplicateWorkflow(session.workspaceId, id);
    if (!duplicated) return notFound();

    return ok(duplicated, 201);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/workflows/[id]/duplicate", action: "POST" });
    return internalError();
  }
}
