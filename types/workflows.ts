export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

export type WorkflowConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "before_date"
  | "after_date";

export interface WorkflowCondition {
  workflowId: string;
  fieldKey: string;
  operator: WorkflowConditionOperator;
  valueText?: string | null;
  valueNumber?: number | null;
  valueDate?: string | null;
  groupId?: string | null;
}


export type WorkflowActionType =
  | "send_email"
  | "append_sheet_row"
  | "create_calendar_event"
  | "call_webhook"
  | "send_slack_message"
  | "create_google_doc"
  | "export_pdf"
  | "create_internal_task";

export interface WorkflowAction {
  actionType: WorkflowActionType;
  step_order?: number;
  stop_on_failure?: boolean;
  config: Record<string, unknown>;
}

export interface WorkflowRecord {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  triggerType: "form_submission" | "webhook";
  formId: string | null;
  status: WorkflowStatus;
  conditionMode: "all" | "any";
  settingsJson: Record<string, unknown>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
}
