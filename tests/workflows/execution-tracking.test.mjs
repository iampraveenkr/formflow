import test from "node:test";
import assert from "node:assert/strict";
import { createWorkflow } from "../../lib/server/db/workflows/repo.mjs";
import {
  getWorkflowRun,
  listWorkflowRunLogs,
  listWorkflowRunSteps,
  searchWorkflowRunLogs
} from "../../lib/server/db/formflow-repo.mjs";
import { processWorkflowTrigger, retryWorkflowStep } from "../../services/workflows/run-orchestrator.mjs";

async function makeWorkflow(name, actions) {
  return createWorkflow({
    workspaceId: "ws_exec",
    name,
    description: null,
    triggerType: "webhook",
    formId: null,
    status: "active",
    conditionMode: "all",
    settingsJson: {},
    conditions: [],
    actions
  });
}

test("duplicate detection with idempotency key prevents duplicate effects", async () => {
  const workflow = await makeWorkflow("Dupes", [
    { actionType: "send_email", step_order: 1, config: { to: "{{email}}", subject: "S", body: "B" } }
  ]);

  const first = await processWorkflowTrigger({
    workspaceId: "ws_exec",
    workflow,
    source: "webhook",
    submission: { email: "a@b.com" },
    externalEventId: "evt_1",
    idempotencyKey: "idem_1"
  });

  const second = await processWorkflowTrigger({
    workspaceId: "ws_exec",
    workflow,
    source: "webhook",
    submission: { email: "a@b.com" },
    externalEventId: "evt_1",
    idempotencyKey: "idem_1"
  });

  assert.equal(second.idempotentReplay, true);
  assert.equal(first.run.id, second.run.id);
});

test("run lifecycle reaches partial_success when one step fails after one success", async () => {
  const workflow = await makeWorkflow("Partial", [
    { actionType: "send_email", step_order: 1, config: { to: "{{email}}", subject: "S", body: "B" } },
    { actionType: "call_webhook", step_order: 2, config: { url: "https://api.example.com/quota", method: "POST" } }
  ]);

  const outcome = await processWorkflowTrigger({
    workspaceId: "ws_exec",
    workflow,
    source: "webhook",
    submission: { email: "test@example.com" },
    externalEventId: "evt_partial",
    idempotencyKey: "idem_partial"
  });

  const run = await getWorkflowRun(outcome.run.id);
  assert.equal(run?.status, "partial_success");

  const steps = await listWorkflowRunSteps(outcome.run.id);
  assert.equal(steps[0].status, "success");
  assert.equal(steps[1].status, "failed");
});

test("retry can succeed on second attempt", async () => {
  const workflow = await makeWorkflow("Retry", [
    { actionType: "call_webhook", step_order: 1, config: { url: "https://api.example.com/quota", method: "POST" } }
  ]);

  const outcome = await processWorkflowTrigger({
    workspaceId: "ws_exec",
    workflow,
    source: "webhook",
    submission: { email: "x@y.com" },
    externalEventId: "evt_retry",
    idempotencyKey: "idem_retry"
  });

  const failedStep = (await listWorkflowRunSteps(outcome.run.id))[0];
  assert.equal(failedStep.status, "failed");

  workflow.actions[0].config.url = "https://api.example.com/hook";
  const retried = await retryWorkflowStep({
    workspaceId: "ws_exec",
    workflow,
    run: outcome.run,
    step: failedStep,
    submission: { email: "x@y.com" }
  });

  assert.equal(retried.step?.status, "success");
  assert.equal(retried.run?.status, "success");
});

test("log integrity includes start/failure/final events and is searchable", async () => {
  const workflow = await makeWorkflow("Logs", [
    { actionType: "send_email", step_order: 1, config: { to: "{{missing}}", subject: "S", body: "B" } }
  ]);

  const outcome = await processWorkflowTrigger({
    workspaceId: "ws_exec",
    workflow,
    source: "webhook",
    submission: {},
    externalEventId: "evt_logs",
    idempotencyKey: "idem_logs"
  });

  const logs = await listWorkflowRunLogs(outcome.run.id);
  assert.equal(logs.some((entry) => entry.message === "workflow.run.started"), true);
  assert.equal(logs.some((entry) => entry.message === "workflow.step.failed"), true);
  assert.equal(logs.some((entry) => entry.message.includes("workflow.run.completed")), true);

  const searched = await searchWorkflowRunLogs("ws_exec", { query: "failed", workflowId: workflow.id });
  assert.equal(searched.length > 0, true);
});
