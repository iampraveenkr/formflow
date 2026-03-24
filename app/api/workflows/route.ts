import { trackError } from "@/lib/observability/error-tracking";
import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { createWorkflow, listWorkflows, searchWorkflows } from "@/lib/server/db/workflows/repo";
import { badRequest, ok, paymentRequired, unauthorized, internalError } from "@/lib/server/http/responses";
import { enforceActionAvailability, enforceWorkflowCreateLimit } from "@/services/billing/enforcement";
import { validateWorkflowInput } from "@/services/workflows/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.workspaceId) return unauthorized();

  const url = new URL(request.url);
  const rows = await searchWorkflows(session.workspaceId, {
    name: url.searchParams.get("name") ?? "",
    formId: url.searchParams.get("formId") ?? "",
    status: url.searchParams.get("status") ?? ""
  });

  return ok(rows);
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    if (!session?.workspaceId) return unauthorized();

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

    const error = validateWorkflowInput({
      name: body.name,
      triggerType: body.triggerType,
      formId: body.formId,
      conditionMode: body.conditionMode,
      actions: body.actions,
      conditions: body.conditions,
      workflowId: null
    });

    if (error) return badRequest(error, "VALIDATION_ERROR");

    const existing = await listWorkflows(session.workspaceId);
    const workflowGate = await enforceWorkflowCreateLimit(session.workspaceId, existing.length);
    if (!workflowGate.allowed) return paymentRequired(workflowGate.reason ?? "Plan limit reached", "PLAN_WORKFLOW_LIMIT");

    const actionGate = await enforceActionAvailability(session.workspaceId, body.actions ?? []);
    if (!actionGate.allowed) return paymentRequired(actionGate.reason ?? "Action locked", "PLAN_ACTION_LOCKED");

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
      status: body.status ?? "draft"
    });

    return ok(workflow, 201);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/workflows", action: "POST" });
    return internalError();
  }
}
