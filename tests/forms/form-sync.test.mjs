import test from "node:test";
import assert from "node:assert/strict";
import { parseGoogleFormSchema, buildTestPayload } from "../../services/forms/parser.mjs";
import {
  saveFormFields,
  updateFieldMapping,
  listFormFields,
  upsertFormCache,
  listFormsByWorkspace,
  setWorkflowForm,
  getWorkflowForm
} from "../../lib/server/db/forms-repo.mjs";

test("form schema parsing normalizes field types", () => {
  const fields = parseGoogleFormSchema({
    items: [
      { questionId: "q1", title: "Email", type: "EMAIL", required: true },
      { questionId: "q2", title: "Details", type: "PARAGRAPH_TEXT" }
    ]
  });

  assert.equal(fields[0].normalizedType, "email");
  assert.equal(fields[1].normalizedType, "multiline");
});

test("field mapping persistence survives schema sync with label changes", async () => {
  const workspaceId = "ws_form";
  const formId = "form_1";

  await saveFormFields(workspaceId, formId, [
    {
      externalFieldId: "q1",
      label: "Name",
      description: null,
      normalizedType: "text",
      required: true,
      options: [],
      stableKey: "name",
      removed: false
    }
  ]);

  await updateFieldMapping(formId, "q1", "customer_name");

  const secondSync = await saveFormFields(workspaceId, formId, [
    {
      externalFieldId: "q1",
      label: "Full Name",
      description: null,
      normalizedType: "text",
      required: true,
      options: [],
      stableKey: "full_name",
      removed: false
    }
  ]);

  assert.equal(secondSync[0].internalFieldKey, "customer_name");
});

test("schema change handling marks removed fields", async () => {
  const workspaceId = "ws_form_changes";
  const formId = "form_2";

  await saveFormFields(workspaceId, formId, [
    {
      externalFieldId: "q1",
      label: "Question 1",
      description: null,
      normalizedType: "text",
      required: false,
      options: [],
      stableKey: "question_1",
      removed: false
    },
    {
      externalFieldId: "q2",
      label: "Question 2",
      description: null,
      normalizedType: "text",
      required: false,
      options: [],
      stableKey: "question_2",
      removed: false
    }
  ]);

  const synced = await saveFormFields(workspaceId, formId, [
    {
      externalFieldId: "q1",
      label: "Question 1",
      description: null,
      normalizedType: "text",
      required: false,
      options: [],
      stableKey: "question_1",
      removed: false
    }
  ]);

  assert.equal(synced.some((field) => field.externalFieldId === "q2" && field.removed), true);
});

test("preview payload generation returns sample values", () => {
  const preview = buildTestPayload([
    { stableKey: "email", normalizedType: "email", options: [] },
    { stableKey: "priority", normalizedType: "choice", options: ["High"] }
  ]);

  assert.equal(preview.email, "user@example.com");
  assert.equal(preview.priority, "High");
});

test("workflow can reference selected synced form", async () => {
  await upsertFormCache({
    id: "form_wf",
    workspaceId: "ws_demo",
    googleFormId: "g_form_123",
    title: "Demo",
    schemaJson: {},
    schemaVersionHash: "abc",
    lastSyncedAt: new Date().toISOString()
  });

  await setWorkflowForm("ws_demo", "wf_1", "form_wf");
  const selected = await getWorkflowForm("ws_demo", "wf_1");
  const list = await listFormsByWorkspace("ws_demo");

  assert.equal(selected?.id, "form_wf");
  assert.equal(list.length > 0, true);
  const fields = await listFormFields("form_wf");
  assert.equal(Array.isArray(fields), true);
});
