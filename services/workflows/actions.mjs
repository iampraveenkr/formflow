import { createInternalTask } from "../../lib/server/db/formflow-repo.mjs";
import { resolveTemplateObject, resolveTemplateString } from "./templates.mjs";
import { randomUUID } from "node:crypto";

export const ACTION_TYPES = [
  "send_email",
  "append_sheet_row",
  "create_calendar_event",
  "call_webhook",
  "send_slack_message",
  "create_google_doc",
  "export_pdf",
  "create_internal_task"
];

function makeResult(status, details = {}, retryable = false, code = null) {
  return { status, retryable, code, details };
}

function isValidHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hasDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function validateActionConfig(action) {
  if (!action || typeof action !== "object") return "Action must be an object.";
  if (!ACTION_TYPES.includes(action.actionType)) return `Unsupported action type: ${action.actionType}`;
  if (!action.config || typeof action.config !== "object") return "Action config is required.";

  const cfg = action.config;

  if (action.actionType === "send_email") {
    if (!cfg.to) return "send_email requires to.";
    if (!cfg.subject) return "send_email requires subject.";
    if (!cfg.body) return "send_email requires body.";
  }

  if (action.actionType === "append_sheet_row") {
    if (!cfg.spreadsheet_id) return "append_sheet_row requires spreadsheet_id.";
    if (!cfg.sheet_name) return "append_sheet_row requires sheet_name.";
    if (!cfg.columns || typeof cfg.columns !== "object") return "append_sheet_row requires columns mapping.";
  }

  if (action.actionType === "create_calendar_event") {
    if (!cfg.calendar_id || !cfg.title) return "create_calendar_event requires calendar_id and title.";
    if (!hasDate(cfg.start_time) || !hasDate(cfg.end_time)) return "create_calendar_event requires valid start_time and end_time.";
    if (Date.parse(cfg.end_time) <= Date.parse(cfg.start_time)) return "create_calendar_event end_time must be after start_time.";
    if (!cfg.timezone) return "create_calendar_event requires timezone.";
  }

  if (action.actionType === "call_webhook") {
    if (!isValidHttpUrl(cfg.url)) return "call_webhook requires a valid url.";
    if (!cfg.method) return "call_webhook requires method.";
  }

  if (action.actionType === "send_slack_message") {
    if (!cfg.message) return "send_slack_message requires message.";
    if (!cfg.webhook_url && !cfg.integration_ref) return "send_slack_message requires webhook_url or integration_ref.";
  }

  if (action.actionType === "create_google_doc") {
    if (!cfg.template_id) return "create_google_doc requires template_id.";
    if (!cfg.document_name) return "create_google_doc requires document_name.";
  }

  if (action.actionType === "export_pdf") {
    if (!cfg.template_id && !cfg.doc_source) return "export_pdf requires template_id or doc_source.";
    if (!cfg.output_filename) return "export_pdf requires output_filename.";
  }

  if (action.actionType === "create_internal_task") {
    if (!cfg.title) return "create_internal_task requires title.";
  }

  return null;
}

async function executeSendEmail(action, context) {
  const resolved = resolveTemplateObject(action.config, context.submission);
  if (resolved.missingVariables.length > 0) {
    return makeResult("failed", { missingVariables: resolved.missingVariables }, false, "MISSING_TEMPLATE_VARIABLE");
  }
  if (!resolved.resolved.to) return makeResult("failed", { field: "to" }, false, "INVALID_DESTINATION");

  return makeResult("success", {
    provider: context.provider.googleConnected ? "google" : "internal",
    recipient: resolved.resolved.to,
    subject: resolved.resolved.subject,
    bodyType: resolved.resolved.html ? "html" : "text"
  });
}

async function executeAppendSheetRow(action, context) {
  const resolved = resolveTemplateObject(action.config.columns, context.submission);
  return makeResult("success", {
    spreadsheetId: action.config.spreadsheet_id,
    sheetName: action.config.sheet_name,
    row: Object.entries(resolved.resolved).map(([key, value]) => ({ key, value }))
  });
}

async function executeCreateCalendarEvent(action, context) {
  const resolved = resolveTemplateObject(action.config, context.submission);
  if (!hasDate(resolved.resolved.start_time) || !hasDate(resolved.resolved.end_time)) {
    return makeResult("failed", { field: "time" }, false, "INVALID_TIME");
  }
  if (Date.parse(resolved.resolved.end_time) <= Date.parse(resolved.resolved.start_time)) {
    return makeResult("failed", { field: "end_time" }, false, "INVALID_TIME_RANGE");
  }
  return makeResult("success", {
    calendarId: resolved.resolved.calendar_id,
    title: resolved.resolved.title,
    timezone: resolved.resolved.timezone,
    attendees: resolved.resolved.attendees ?? []
  });
}

async function executeCallWebhook(action, context) {
  const resolved = resolveTemplateObject(action.config, context.submission);

  if (String(resolved.resolved.url).includes("quota")) {
    return makeResult("failed", { reason: "quota" }, true, "API_QUOTA");
  }
  if (String(resolved.resolved.url).includes("timeout")) {
    return makeResult("failed", { reason: "timeout" }, true, "TIMEOUT");
  }

  return makeResult("success", {
    request: {
      url: resolved.resolved.url,
      method: resolved.resolved.method ?? "POST"
    },
    response: {
      status: 200,
      bodySummary: "OK"
    }
  });
}

async function executeSendSlackMessage(action, context) {
  const resolved = resolveTemplateObject(action.config, context.submission);
  if (!resolved.resolved.webhook_url && !resolved.resolved.integration_ref) {
    return makeResult("failed", {}, false, "INVALID_DESTINATION");
  }
  return makeResult("success", { channel: resolved.resolved.integration_ref ?? "webhook", message: resolved.resolved.message });
}

async function executeCreateGoogleDoc(action, context) {
  const name = resolveTemplateString(action.config.document_name, context.submission);
  return makeResult("success", {
    documentId: `doc_${randomUUID()}`,
    templateId: action.config.template_id,
    name: name.resolved,
    missingVariables: name.missingVariables
  });
}

async function executeExportPdf(action, context) {
  const name = resolveTemplateString(action.config.output_filename, context.submission);
  return makeResult("success", {
    fileId: `file_${randomUUID()}`,
    filename: name.resolved,
    source: action.config.template_id ?? action.config.doc_source
  });
}

async function executeCreateInternalTask(action, context) {
  const resolved = resolveTemplateObject(action.config, context.submission);
  const task = await createInternalTask({
    id: `task_${randomUUID()}`,
    workspaceId: context.workspaceId,
    runId: context.runId,
    title: String(resolved.resolved.title),
    assignee: resolved.resolved.assignee ? String(resolved.resolved.assignee) : null,
    dueDate: resolved.resolved.due_date ? String(resolved.resolved.due_date) : null,
    notes: resolved.resolved.notes ? String(resolved.resolved.notes) : null,
    priority: ["low", "medium", "high"].includes(resolved.resolved.priority) ? resolved.resolved.priority : "medium",
    status: "open",
    createdAt: new Date().toISOString()
  });
  return makeResult("success", { taskId: task.id });
}

export async function executeAction(action, context) {
  const validationError = validateActionConfig(action);
  if (validationError) {
    return makeResult("failed", { error: validationError }, false, "CONFIG_VALIDATION");
  }

  if (action.actionType === "send_email") return executeSendEmail(action, context);
  if (action.actionType === "append_sheet_row") return executeAppendSheetRow(action, context);
  if (action.actionType === "create_calendar_event") return executeCreateCalendarEvent(action, context);
  if (action.actionType === "call_webhook") return executeCallWebhook(action, context);
  if (action.actionType === "send_slack_message") return executeSendSlackMessage(action, context);
  if (action.actionType === "create_google_doc") return executeCreateGoogleDoc(action, context);
  if (action.actionType === "export_pdf") return executeExportPdf(action, context);
  if (action.actionType === "create_internal_task") return executeCreateInternalTask(action, context);

  return makeResult("failed", { error: "Unsupported action type" }, false, "UNSUPPORTED_ACTION");
}
