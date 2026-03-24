import { requireWorkspaceSession } from "@/lib/server/auth/require-workspace-session";
import { trackError } from "@/lib/observability/error-tracking";
import { upsertSubscription } from "@/lib/server/db/billing/repo";
import { badRequest, internalError, ok } from "@/lib/server/http/responses";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = requireWorkspaceSession(request);
    if (session instanceof Response) return session;

    const body = (await request.json()) as { planId?: "free" | "starter" | "pro" | string };
    if (!body.planId) return badRequest("planId is required", "VALIDATION_ERROR");

    const planId = body.planId;
    if (!["free", "starter", "pro"].includes(planId)) {
      return badRequest("planId is invalid", "VALIDATION_ERROR");
    }

    const subscription = await upsertSubscription(session.workspaceId, {
      planId,
      status: "active",
      graceUntil: null,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: null
    });

    return ok({ checkoutUrl: `/billing?upgraded=${planId}`, subscription });
  } catch (error) {
    trackError(error, { area: "api", route: "/api/billing/checkout", action: "POST" });
    return internalError();
  }
}
