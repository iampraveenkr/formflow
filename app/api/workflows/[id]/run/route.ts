import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { findWorkflow } from "@/lib/server/db/workflows/repo";
import { processWorkflowTrigger } from "@/services/workflows/run-orchestrator";
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

  const workflow = await findWorkflow(session.workspaceId, id);
  if (!workflow) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    submission?: Record<string, unknown>;
    idempotencyKey?: string;
    externalEventId?: string | null;
    source?: "webhook" | "form_submission";
    stopOnFailure?: boolean;
  };

  if (!body.idempotencyKey) {
    return NextResponse.json({ ok: false, error: "idempotencyKey is required." }, { status: 400 });
  }

  const outcome = await processWorkflowTrigger({
    workspaceId: session.workspaceId,
    workflow,
    source: body.source ?? "webhook",
    submission: body.submission ?? {},
    externalEventId: body.externalEventId ?? null,
    idempotencyKey: body.idempotencyKey,
    stopOnFailure: body.stopOnFailure ?? true
  });

  return NextResponse.json({ ok: true, data: outcome }, { status: 200 });
}
