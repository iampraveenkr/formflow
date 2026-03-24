import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { findWorkflow, updateWorkflow } from "@/lib/server/db/workflows/repo";
import { validateStatusTransition, validateWorkflowInput } from "@/services/workflows/validation";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  const { id } = await params;

  if (!session?.workspaceId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const workflow = await findWorkflow(session.workspaceId, id);
  if (!workflow) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: workflow }, { status: 200 });
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  const { id } = await params;

  if (!session?.workspaceId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const current = await findWorkflow(session.workspaceId, id);
  if (!current) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    triggerType?: "form_submission" | "webhook";
    formId?: string | null;
    conditionMode?: "all" | "any";
    settingsJson?: Record<string, unknown>;
    conditions?: Array<Record<string, unknown>>;
    actions?: Array<Record<string, unknown>>;
    status?: "draft" | "active" | "paused" | "archived";
  };

  const inputError = validateWorkflowInput({
    name: body.name ?? current.name,
    triggerType: body.triggerType ?? current.triggerType,
    formId: body.formId ?? current.formId,
    conditionMode: body.conditionMode ?? current.conditionMode,
    actions: body.actions ?? current.actions,
    conditions: body.conditions ?? current.conditions,
    workflowId: id
  });

  if (inputError) {
    return NextResponse.json({ ok: false, error: inputError }, { status: 400 });
  }

  if (body.status) {
    const transitionError = validateStatusTransition(current.status, body.status);
    if (transitionError) {
      return NextResponse.json({ ok: false, error: transitionError }, { status: 400 });
    }
  }

  const updated = await updateWorkflow(session.workspaceId, id, {
    ...body
  });

  return NextResponse.json({ ok: true, data: updated }, { status: 200 });
}
