const workflowRuns = new Map();
const workflowRunSteps = new Map();
const workflowRunLogs = new Map();
const triggerEvents = new Map();
const internalTasks = new Map();
const retryQueue = new Map();

export async function createTriggerEvent(event) {
  if (event.externalEventId) {
    for (const existing of triggerEvents.values()) {
      if (
        existing.workspaceId === event.workspaceId &&
        existing.workflowId === event.workflowId &&
        existing.externalEventId === event.externalEventId
      ) {
        return existing;
      }
    }
  }
  triggerEvents.set(event.id, event);
  return event;
}

export async function findTriggerEventById(id) {
  return triggerEvents.get(id) ?? null;
}

export async function listTriggerEventsByWorkspace(workspaceId) {
  return Array.from(triggerEvents.values()).filter((event) => event.workspaceId === workspaceId);
}

export async function createWorkflowRun(run) {
  if (!run.idempotencyKey) {
    throw new Error("idempotencyKey is required");
  }

  for (const existing of workflowRuns.values()) {
    if (
      existing.workspaceId === run.workspaceId &&
      existing.workflowId === run.workflowId &&
      existing.idempotencyKey === run.idempotencyKey
    ) {
      return existing;
    }
  }

  workflowRuns.set(run.id, run);
  return run;
}

export async function updateWorkflowRun(runId, patch) {
  const existing = workflowRuns.get(runId);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  workflowRuns.set(runId, updated);
  return updated;
}

export async function getWorkflowRun(runId) {
  return workflowRuns.get(runId) ?? null;
}

export async function listWorkflowRunsByWorkspace(workspaceId, filters = {}) {
  return Array.from(workflowRuns.values())
    .filter((run) => run.workspaceId === workspaceId)
    .filter((run) => (filters.workflowId ? run.workflowId === filters.workflowId : true))
    .filter((run) => (filters.status ? run.status === filters.status : true))
    .filter((run) => (filters.dateFrom ? run.createdAt >= filters.dateFrom : true))
    .filter((run) => (filters.dateTo ? run.createdAt <= filters.dateTo : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createWorkflowRunStep(step) {
  workflowRunSteps.set(step.id, step);
  return step;
}

export async function updateWorkflowRunStep(stepId, patch) {
  const existing = workflowRunSteps.get(stepId);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  workflowRunSteps.set(stepId, updated);
  return updated;
}

export async function getWorkflowRunStep(stepId) {
  return workflowRunSteps.get(stepId) ?? null;
}

export async function listWorkflowRunSteps(runId, filters = {}) {
  return Array.from(workflowRunSteps.values())
    .filter((step) => step.runId === runId)
    .filter((step) => (filters.actionType ? step.actionType === filters.actionType : true))
    .filter((step) => (filters.status ? step.status === filters.status : true))
    .sort((a, b) => a.stepOrder - b.stepOrder);
}

export async function createWorkflowRunLog(log) {
  workflowRunLogs.set(log.id, log);
  return log;
}

export async function listWorkflowRunLogs(runId) {
  return Array.from(workflowRunLogs.values())
    .filter((log) => log.runId === runId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function searchWorkflowRunLogs(workspaceId, filters = {}) {
  const runs = await listWorkflowRunsByWorkspace(workspaceId, {
    workflowId: filters.workflowId,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  });
  const runIds = new Set(runs.map((run) => run.id));

  return Array.from(workflowRunLogs.values())
    .filter((log) => runIds.has(log.runId))
    .filter((log) => {
      if (!filters.query) return true;
      const haystack = `${log.message} ${JSON.stringify(log.metadata ?? {})}`.toLowerCase();
      return haystack.includes(filters.query.toLowerCase());
    })
    .filter((log) => {
      if (!filters.actionType) return true;
      const step = Array.from(workflowRunSteps.values()).find((row) => row.id === log.stepId);
      return step?.actionType === filters.actionType;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function enqueueRunRetry(item) {
  retryQueue.set(item.id, item);
  return item;
}

export async function updateRetryQueueItem(id, patch) {
  const existing = retryQueue.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  retryQueue.set(id, updated);
  return updated;
}

export async function listRetryQueue(workspaceId) {
  return Array.from(retryQueue.values()).filter((item) => item.workspaceId === workspaceId);
}

export async function createInternalTask(task) {
  internalTasks.set(task.id, task);
  return task;
}

export async function listInternalTasksByWorkspace(workspaceId) {
  return Array.from(internalTasks.values()).filter((task) => task.workspaceId === workspaceId);
}
