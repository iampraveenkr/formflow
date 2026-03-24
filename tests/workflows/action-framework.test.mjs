import test from "node:test";
import assert from "node:assert/strict";
import { resolveTemplateObject, resolveTemplateString } from "../../services/workflows/templates.mjs";
import { executeAction, validateActionConfig } from "../../services/workflows/actions.mjs";
import { executeWorkflowActions } from "../../services/workflows/executor.mjs";

const baseContext = {
  workspaceId: "ws_1",
  workflowId: "wf_1",
  runId: "run_1",
  submission: { first_name: "Ada", email: "ada@example.com", company: "ACME", score: "0012" },
  provider: { googleConnected: true }
};

test("template replacement resolves variables and reports missing keys", () => {
  const text = resolveTemplateString("Hello {{first_name}} from {{missing}}", baseContext.submission);
  assert.equal(text.resolved, "Hello Ada from ");
  assert.deepEqual(text.missingVariables, ["missing"]);

  const obj = resolveTemplateObject({ subject: "Hi {{first_name}}", email: "{{email}}" }, baseContext.submission);
  assert.equal(obj.resolved.subject, "Hi Ada");
  assert.equal(obj.resolved.email, "ada@example.com");
});

test("all v1 action configs validate", () => {
  const actions = [
    { actionType: "send_email", config: { to: "{{email}}", subject: "Welcome", body: "Body" } },
    { actionType: "append_sheet_row", config: { spreadsheet_id: "sheet_1", sheet_name: "Leads", columns: { name: "{{first_name}}", email: "{{email}}" } } },
    { actionType: "create_calendar_event", config: { calendar_id: "cal_1", title: "Meeting", start_time: "2026-03-25T10:00:00Z", end_time: "2026-03-25T11:00:00Z", timezone: "UTC" } },
    { actionType: "call_webhook", config: { url: "https://api.example.com/hook", method: "POST" } },
    { actionType: "send_slack_message", config: { webhook_url: "https://hooks.slack.com/test", message: "New lead" } },
    { actionType: "create_google_doc", config: { template_id: "tpl_1", document_name: "Doc {{first_name}}" } },
    { actionType: "export_pdf", config: { template_id: "tpl_1", output_filename: "contract-{{first_name}}.pdf" } },
    { actionType: "create_internal_task", config: { title: "Follow up {{first_name}}", priority: "high" } }
  ];

  for (const action of actions) {
    assert.equal(validateActionConfig(action), null);
  }
});

test("each action executes and returns normalized result", async () => {
  const actionList = [
    { actionType: "send_email", config: { to: "{{email}}", subject: "Welcome", body: "Hello {{first_name}}" } },
    { actionType: "append_sheet_row", config: { spreadsheet_id: "sheet_1", sheet_name: "Leads", columns: { name: "{{first_name}}", company: "{{company}}" } } },
    { actionType: "create_calendar_event", config: { calendar_id: "cal_1", title: "Intro", start_time: "2026-03-25T10:00:00Z", end_time: "2026-03-25T11:00:00Z", timezone: "UTC" } },
    { actionType: "call_webhook", config: { url: "https://api.example.com/hook", method: "POST" } },
    { actionType: "send_slack_message", config: { webhook_url: "https://hooks.slack.com/test", message: "Lead {{email}}" } },
    { actionType: "create_google_doc", config: { template_id: "tpl_1", document_name: "Doc {{first_name}}" } },
    { actionType: "export_pdf", config: { template_id: "tpl_1", output_filename: "{{first_name}}.pdf" } },
    { actionType: "create_internal_task", config: { title: "Task {{first_name}}", assignee: "ops@acme.io", priority: "high" } }
  ];

  for (const action of actionList) {
    const result = await executeAction(action, baseContext);
    assert.equal(typeof result.status, "string");
    assert.equal(typeof result.retryable, "boolean");
    assert.equal(result.status === "success" || result.status === "failed", true);
    assert.equal(typeof result.details, "object");
  }
});

test("execution order follows step_order and stops on failure by default", async () => {
  const started = [];
  const finished = [];
  const actions = [
    { actionType: "send_email", step_order: 2, config: { to: "{{email}}", subject: "S", body: "B" } },
    { actionType: "call_webhook", step_order: 1, config: { url: "https://api.example.com/quota", method: "POST" } },
    { actionType: "send_slack_message", step_order: 3, config: { webhook_url: "https://hooks.slack.com/test", message: "msg" } }
  ];

  const result = await executeWorkflowActions({
    actions,
    submission: baseContext.submission,
    context: baseContext,
    onStepStart: async ({ stepOrder }) => started.push(stepOrder),
    onStepResult: async ({ stepOrder, result: stepResult }) => finished.push([stepOrder, stepResult.status]),
    stopOnFailure: true
  });

  assert.deepEqual(started, [1]);
  assert.equal(result.hasFailure, true);
  assert.deepEqual(finished[0], [1, "failed"]);
});

test("failure and retryability are surfaced", async () => {
  const timeout = await executeAction({ actionType: "call_webhook", config: { url: "https://api.example.com/timeout", method: "POST" } }, baseContext);
  assert.equal(timeout.status, "failed");
  assert.equal(timeout.retryable, true);

  const badEmail = await executeAction({ actionType: "send_email", config: { subject: "x", body: "y" } }, baseContext);
  assert.equal(badEmail.status, "failed");
  assert.equal(badEmail.retryable, false);
});
