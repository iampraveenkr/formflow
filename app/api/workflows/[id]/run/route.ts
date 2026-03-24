import { trackEvent } from "@/lib/observability/analytics";
import { trackError } from "@/lib/observability/error-tracking";
import { getSessionFromCookieHeader } from "@/lib/server/auth/request-session";
import { badRequest, notFound, ok, paymentRequired, unauthorized, internalError } from "@/lib/server/http/responses";
import { findWorkflow } from "@/lib/server/db/workflows/repo";
import { enforceRunLimit, recordRunUsage } from "@/services/billing/enforcement";
import { processWorkflowTrigger } from "@/services/workflows/run-orchestrator";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  try {
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    const { id } = await params;

    if (!session?.workspaceId) return unauthorized();

    const workflow = await findWorkflow(session.workspaceId, id);
    if (!workflow) return notFound();

    const body = (await request.json()) as {
      submission?: Record<string, unknown>;
      idempotencyKey?: string;
      externalEventId?: string | null;
      source?: "webhook" | "form_submission";
      stopOnFailure?: boolean;
    };

    if (!body.idempotencyKey) return badRequest("idempotencyKey is required.", "VALIDATION_ERROR");

    const runGate = await enforceRunLimit(session.workspaceId);
    if (!runGate.allowed) {
      return paymentRequired(runGate.reason ?? "Plan run limit reached.", "PLAN_RUN_LIMIT", { plan: runGate.plan, usage: runGate.usage });
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

    await recordRunUsage(session.workspaceId);
    trackEvent({ event: "workflow_run_processed", workspaceId: session.workspaceId, properties: { workflowId: workflow.id, status: outcome.run?.status } });

    return ok(outcome);
  } catch (error) {
    trackError(error, { area: "api", route: "/api/workflows/[id]/run", action: "POST" });
    return internalError();
  }
}
