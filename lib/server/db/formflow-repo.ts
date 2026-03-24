interface WorkflowRunRecord {
  id: string;
  workspaceId: string;
  workflowId: string;
  idempotencyKey: string | null;
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown> | null;
  errorSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

const workflowRuns = new Map<string, WorkflowRunRecord>();

export async function createWorkflowRun(run: WorkflowRunRecord): Promise<WorkflowRunRecord> {
  if (run.idempotencyKey) {
    for (const existing of workflowRuns.values()) {
      if (existing.workspaceId === run.workspaceId && existing.idempotencyKey === run.idempotencyKey) {
        return existing;
      }
    }
  }

  workflowRuns.set(run.id, run);
  return run;
}

export async function listWorkflowRunsByWorkspace(workspaceId: string): Promise<WorkflowRunRecord[]> {
  return Array.from(workflowRuns.values()).filter((run) => run.workspaceId === workspaceId);
}
