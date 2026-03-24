import test from "node:test";
import assert from "node:assert/strict";
import { createWorkflowRun } from "../../lib/server/db/formflow-repo.mjs";

test("workflow run idempotency returns existing run for duplicate key", async () => {
  const first = await createWorkflowRun({
    id: "run_idem_a",
    triggerEventId: "evt_a",
    workspaceId: "ws_idem",
    workflowId: "wf_idem",
    idempotencyKey: "idem_key_1",
    status: "queued",
    inputPayload: {},
    outputPayload: null,
    errorSummary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const second = await createWorkflowRun({
    id: "run_idem_b",
    triggerEventId: "evt_b",
    workspaceId: "ws_idem",
    workflowId: "wf_idem",
    idempotencyKey: "idem_key_1",
    status: "queued",
    inputPayload: {},
    outputPayload: null,
    errorSummary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  assert.equal(first.id, second.id);
});
