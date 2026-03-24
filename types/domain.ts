export type TenantRole = "owner" | "admin" | "member";

export type WorkflowStatus = "draft" | "active" | "paused";

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}
