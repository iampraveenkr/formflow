import test from "node:test";
import assert from "node:assert/strict";
import { createWorkflow } from "../../lib/server/db/workflows/repo.mjs";
import { listWorkflowRunLogs, listWorkflowRunSteps } from "../../lib/server/db/formflow-repo.mjs";
import { enforceRunLimit, recordRunUsage } from "../../services/billing/enforcement.mjs";
import { processWorkflowTrigger, retryWorkflowStep } from "../../services/workflows/run-orchestrator.mjs";
import { decideProtectedRouteRedirect } from "../../services/auth/guards.mjs";

test("integration: workflow creation -> trigger processing -> logs and retries", async () => {
  const workflow = await createWorkflow({
    workspaceId: "ws_integration",
    name: "Integration Flow",
    description: null,
    triggerType: "webhook",
    formId: null,
    status: "active",
    conditionMode: "all",
    settingsJson: {},
    conditions: [],
    actions: [
      { actionType: "send_email", step_order: 1, config: { to: "ops@example.com", subject: "s", body: "b" } },
      { actionType: "call_webhook", step_order: 2, config: { url: "https://api.example.com/quota", method: "POST" } }
    ]
  });

  const outcome = await processWorkflowTrigger({
    workspaceId: "ws_integration",
    workflow,
    source: "webhook",
    submission: { email: "lead@example.com" },
    externalEventId: "evt_int_1",
    idempotencyKey: "idem_int_1"
  });

  const steps = await listWorkflowRunSteps(outcome.run.id);
  const logs = await listWorkflowRunLogs(outcome.run.id);
  assert.equal(steps.length >= 2, true);
  assert.equal(logs.length > 0, true);

  const failed = steps.find((step) => step.status === "failed");
  assert.ok(failed);

  workflow.actions[1].config.url = "https://api.example.com/hook";
  const retried = await retryWorkflowStep({
    workspaceId: "ws_integration",
    workflow,
    run: outcome.run,
    step: failed,
    submission: { email: "lead@example.com" }
  });
  assert.equal(retried.step?.status, "success");
});

test("integration: billing run limit enforcement and auth redirect behavior", async () => {
  for (let i = 0; i < 100; i += 1) {
    await recordRunUsage("ws_integration_limit");
  }

  const gate = await enforceRunLimit("ws_integration_limit");
  assert.equal(gate.allowed, false);

  const redirect = decideProtectedRouteRedirect("/dashboard", null);
  assert.equal(redirect.redirectTo, "/login");
});
