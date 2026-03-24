import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { trackError } from "@/lib/observability/error-tracking";
import { duplicateWorkflow } from "@/lib/server/db/workflows/repo";
import { internalError, notFound, ok, unauthorized } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    const { id } = await params;

    if (!session?.workspaceId) return unauthorized();

    const duplicated = await duplicateWorkflow(session.workspaceId, id);
    if (!duplicated) return notFound();

    return ok(duplicated, 201);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/workflows/[id]/duplicate", action: "POST" });
    return internalError();
  }
}
