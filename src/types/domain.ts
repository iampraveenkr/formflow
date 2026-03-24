export type TenantRole = "owner" | "admin" | "member";

export type WorkflowStatus = "draft" | "active" | "paused";

// Default values are intentionally conservative until product requirements are finalized.
export const DEFAULT_WORKFLOW_STATUS: WorkflowStatus = "draft";
