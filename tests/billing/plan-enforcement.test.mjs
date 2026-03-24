import test from "node:test";
import assert from "node:assert/strict";
import { getUsage, upsertSubscription } from "../../lib/server/db/billing/repo.mjs";
import {
  enforceAccountConnectionLimit,
  enforceActionAvailability,
  enforceRunLimit,
  enforceWorkflowCreateLimit,
  resolveWorkspacePlan
} from "../../services/billing/enforcement.mjs";

const ws = "ws_billing";

test("defaults to free plan and enforces workflow/account limits", async () => {
  const resolved = await resolveWorkspacePlan(ws);
  assert.equal(resolved.plan.id, "free");

  const wfOk = await enforceWorkflowCreateLimit(ws, 1);
  const wfBlocked = await enforceWorkflowCreateLimit(ws, 2);
  assert.equal(wfOk.allowed, true);
  assert.equal(wfBlocked.allowed, false);

  const accOk = await enforceAccountConnectionLimit(ws, 0);
  const accBlocked = await enforceAccountConnectionLimit(ws, 1);
  assert.equal(accOk.allowed, true);
  assert.equal(accBlocked.allowed, false);
});

test("free plan locks unsupported actions", async () => {
  const gate = await enforceActionAvailability(ws, [{ actionType: "create_google_doc" }]);
  assert.equal(gate.allowed, false);
});

test("starter plan unlocks more actions", async () => {
  await upsertSubscription(ws, { planId: "starter", status: "active" });
  const gate = await enforceActionAvailability(ws, [{ actionType: "append_sheet_row" }]);
  assert.equal(gate.allowed, true);
});

test("run limit blocks when monthly quota reached", async () => {
  await upsertSubscription(ws, { planId: "free", status: "active" });
  const usage = await getUsage(ws);
  usage.runs = 100;
  const gate = await enforceRunLimit(ws);
  assert.equal(gate.allowed, false);
  assert.equal(String(gate.reason).includes("Monthly run limit reached"), true);
});
