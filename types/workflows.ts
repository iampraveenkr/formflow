export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

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
  conditions: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}
