import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { duplicateWorkflow } from "@/lib/server/db/workflows/repo";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  const { id } = await params;

  if (!session?.workspaceId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const duplicated = await duplicateWorkflow(session.workspaceId, id);
  if (!duplicated) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: duplicated }, { status: 201 });
}
