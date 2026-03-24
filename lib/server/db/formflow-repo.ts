export {
  createTriggerEvent,
  findTriggerEventById,
  listTriggerEventsByWorkspace,
  createWorkflowRun,
  updateWorkflowRun,
  getWorkflowRun,
  listWorkflowRunsByWorkspace,
  createWorkflowRunStep,
  updateWorkflowRunStep,
  getWorkflowRunStep,
  listWorkflowRunSteps,
  createWorkflowRunLog,
  listWorkflowRunLogs,
  searchWorkflowRunLogs,
  enqueueRunRetry,
  updateRetryQueueItem,
  listRetryQueue,
  createInternalTask,
  listInternalTasksByWorkspace
} from "./formflow-repo.mjs";

export interface TriggerEventRecord {
  id: string;
  workspaceId: string;
  workflowId: string;
  idempotencyKey: string;
  externalEventId: string | null;
  source: "webhook" | "form_submission" | "manual_retry";
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface WorkflowRunRecord {
  id: string;
  triggerEventId: string | null;
  workspaceId: string;
  workflowId: string;
  idempotencyKey: string;
  status: "queued" | "running" | "success" | "failed" | "partial_success" | "skipped";
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown> | null;
  errorSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRunStepRecord {
  id: string;
  runId: string;
  workflowId: string;
  actionType: string;
  stepOrder: number;
  status: "pending" | "running" | "success" | "failed" | "retrying" | "skipped";
  retryable: boolean;
  attemptCount: number;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown> | null;
  errorSummary: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface WorkflowRunLogRecord {
  id: string;
  runId: string;
  stepId: string | null;
  level: "info" | "warn" | "error";
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface RetryQueueItem {
  id: string;
  workspaceId: string;
  runId: string;
  stepId: string | null;
  status: "queued" | "running" | "completed" | "failed" | "dead_letter";
  attempt: number;
  maxAttempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InternalTaskRecord {
  id: string;
  workspaceId: string;
  runId: string;
  title: string;
  assignee: string | null;
  dueDate: string | null;
  notes: string | null;
  priority: "low" | "medium" | "high";
  status: "open" | "done";
  createdAt: string;
}
