import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { badRequest, internalError, notFound, ok, paymentRequired } from "@/lib/server/http/responses";
import { findWorkflow, updateWorkflow } from "@/lib/server/db/workflows/repo";
import { enforceActionAvailability } from "@/services/billing/enforcement";
import { validateStatusTransition, validateWorkflowInput } from "@/services/workflows/validation";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    const { id } = await params;

    if (session instanceof Response) return session;

    const workflow = await findWorkflow(session.workspaceId, id);
    if (!workflow) return notFound();

    return ok(workflow);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/workflows/[id]", action: "GET" });
    return internalError();
  }
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    const { id } = await params;

    if (session instanceof Response) return session;

    const current = await findWorkflow(session.workspaceId, id);
    if (!current) return notFound();

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

    if (inputError) return badRequest(inputError, "VALIDATION_ERROR");

    if (body.status) {
      const transitionError = validateStatusTransition(current.status, body.status);
      if (transitionError) {
        return badRequest(transitionError, "VALIDATION_ERROR");
      }
    }

    const actionGate = await enforceActionAvailability(session.workspaceId, body.actions ?? current.actions);
    if (!actionGate.allowed) {
      return paymentRequired(actionGate.reason ?? "Action locked", "PLAN_ACTION_LOCKED");
    }

    const updated = await updateWorkflow(session.workspaceId, id, {
      ...body
    });

    return ok(updated);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/workflows/[id]", action: "PATCH" });
    return internalError();
  }
}
