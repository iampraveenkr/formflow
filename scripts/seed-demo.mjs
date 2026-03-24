import dataset from "../db/fixtures/demo-dataset.json" with { type: "json" };
import { upsertGoogleAccount } from "../lib/server/integrations/google-connections-repo.mjs";
import { upsertFormCache, setWorkflowForm } from "../lib/server/db/forms-repo.mjs";
import { createWorkflow } from "../lib/server/db/workflows/repo.mjs";
import { createWorkflowRun, createWorkflowRunLog, createWorkflowRunStep } from "../lib/server/db/formflow-repo.mjs";

const now = new Date().toISOString();

await upsertGoogleAccount(dataset.googleAccount);
await upsertFormCache(dataset.form);

const workflow = await createWorkflow({
  workspaceId: dataset.workspace.id,
  name: dataset.workflow.name,
  description: dataset.workflow.description,
  triggerType: dataset.workflow.triggerType,
  formId: dataset.workflow.formId,
  status: dataset.workflow.status,
  conditionMode: dataset.workflow.conditionMode,
  settingsJson: {},
  conditions: dataset.workflow.conditions,
  actions: dataset.workflow.actions
});

await setWorkflowForm(dataset.workspace.id, workflow.id, dataset.form.id);

const run = await createWorkflowRun({
  id: "run_demo_failed",
  triggerEventId: "evt_demo_failed",
  workspaceId: dataset.workspace.id,
  workflowId: workflow.id,
  idempotencyKey: "idem_demo_failed",
  status: "partial_success",
  inputPayload: { email: "lead@example.com", first_name: "Alex", company: "Acme" },
  outputPayload: null,
  errorSummary: "One or more actions failed.",
  createdAt: now,
  updatedAt: now
});

await createWorkflowRunStep({
  id: "step_demo_1",
  runId: run.id,
  workflowId: workflow.id,
  actionType: "send_email",
  stepOrder: 1,
  status: "success",
  retryable: false,
  attemptCount: 1,
  inputPayload: dataset.workflow.actions[0],
  outputPayload: { recipient: "ops@formflow.local" },
  errorSummary: null,
  startedAt: now,
  completedAt: now
});

await createWorkflowRunStep({
  id: "step_demo_2",
  runId: run.id,
  workflowId: workflow.id,
  actionType: "call_webhook",
  stepOrder: 2,
  status: "failed",
  retryable: true,
  attemptCount: 1,
  inputPayload: dataset.workflow.actions[1],
  outputPayload: { reason: "timeout" },
  errorSummary: "TIMEOUT",
  startedAt: now,
  completedAt: now
});

for (const [index, sample] of dataset.logSamples.entries()) {
  await createWorkflowRunLog({
    id: `log_demo_${index + 1}`,
    runId: run.id,
    stepId: sample.message.includes("step") ? "step_demo_2" : null,
    level: sample.level,
    message: sample.message,
    metadata: { seed: true },
    createdAt: now
  });
}

console.log("Demo seed loaded for workspace", dataset.workspace.id);
console.log("Workflow", workflow.id, "Run", run.id, "(failed run for retry testing)");
