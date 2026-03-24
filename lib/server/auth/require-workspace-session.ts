import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { unauthorized } from "@/lib/server/http/responses";
import type { SessionPayload } from "@/types/auth";
import type { NextResponse } from "next/server";

export interface WorkspaceSession extends SessionPayload {
  workspaceId: string;
}

export function requireWorkspaceSession(request: Request): WorkspaceSession | NextResponse {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return unauthorized();
  }

  return {
    ...session,
    workspaceId: session.workspaceId
  };
}
