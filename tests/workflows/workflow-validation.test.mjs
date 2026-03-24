import test from "node:test";
import assert from "node:assert/strict";
import { validateWorkflowInput } from "../../services/workflows/validation.mjs";

test("workflow validation rejects invalid trigger/conditions/actions", () => {
  const missingName = validateWorkflowInput({
    name: "",
    triggerType: "form_submission",
    formId: "form_1",
    conditionMode: "all",
    actions: [{ actionType: "send_email", config: { to: "a@b.com", subject: "s", body: "b" } }],
    conditions: []
  });
  assert.equal(typeof missingName, "string");

  const missingForm = validateWorkflowInput({
    name: "Lead flow",
    triggerType: "form_submission",
    formId: null,
    conditionMode: "all",
    actions: [{ actionType: "send_email", config: { to: "a@b.com", subject: "s", body: "b" } }],
    conditions: []
  });
  assert.equal(missingForm, "formId is required for form_submission trigger.");

  const badAction = validateWorkflowInput({
    name: "Lead flow",
    triggerType: "webhook",
    formId: null,
    conditionMode: "all",
    actions: [{ actionType: "create_google_doc", config: { document_name: "Doc" } }],
    conditions: []
  });
  assert.equal(typeof badAction, "string");
});
