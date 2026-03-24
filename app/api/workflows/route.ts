import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { createWorkflow, searchWorkflows } from "@/lib/server/db/workflows/repo";
import { validateWorkflowInput } from "@/services/workflows/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rows = await searchWorkflows(session.workspaceId, {
    name: url.searchParams.get("name") ?? "",
    formId: url.searchParams.get("formId") ?? "",
    status: url.searchParams.get("status") ?? ""
  });

  return NextResponse.json({ ok: true, data: rows }, { status: 200 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
  };

  const error = validateWorkflowInput({
    name: body.name,
    triggerType: body.triggerType,
    formId: body.formId,
    conditionMode: body.conditionMode,
    actions: body.actions
  });

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  const workflow = await createWorkflow({
    workspaceId: session.workspaceId,
    name: body.name,
    description: body.description,
    triggerType: body.triggerType,
    formId: body.formId,
    conditionMode: body.conditionMode,
    settingsJson: body.settingsJson,
    conditions: body.conditions,
    actions: body.actions,
    status: "draft"
  });

  return NextResponse.json({ ok: true, data: workflow }, { status: 201 });
}
