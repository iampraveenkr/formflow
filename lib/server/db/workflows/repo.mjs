import { randomUUID } from "node:crypto";

const workflows = new Map();

function now() {
  return new Date().toISOString();
}

export async function createWorkflow(input) {
  const record = {
    id: `wf_${randomUUID()}`,
    workspaceId: input.workspaceId,
    name: input.name,
    description: input.description ?? null,
    triggerType: input.triggerType,
    formId: input.formId ?? null,
    status: input.status ?? "draft",
    conditionMode: input.conditionMode,
    settingsJson: input.settingsJson ?? {},
    conditions: input.conditions ?? [],
    actions: input.actions ?? [],
    createdAt: now(),
    updatedAt: now()
  };

  workflows.set(record.id, record);
  return record;
}

export async function listWorkflows(workspaceId) {
  return Array.from(workflows.values()).filter((workflow) => workflow.workspaceId === workspaceId);
}

export async function findWorkflow(workspaceId, workflowId) {
  const workflow = workflows.get(workflowId);
  if (!workflow || workflow.workspaceId !== workspaceId) return null;
  return workflow;
}

export async function updateWorkflow(workspaceId, workflowId, patch) {
  const workflow = await findWorkflow(workspaceId, workflowId);
  if (!workflow) return null;
  const updated = { ...workflow, ...patch, updatedAt: now() };
  workflows.set(workflowId, updated);
  return updated;
}

export async function duplicateWorkflow(workspaceId, workflowId) {
  const workflow = await findWorkflow(workspaceId, workflowId);
  if (!workflow) return null;

  return createWorkflow({
    ...workflow,
    workspaceId,
    name: `${workflow.name} (Copy)`,
    status: "draft"
  });
}

export async function searchWorkflows(workspaceId, query) {
  const rows = await listWorkflows(workspaceId);

  return rows.filter((workflow) => {
    if (query.status && workflow.status !== query.status) return false;
    if (query.formId && workflow.formId !== query.formId) return false;
    if (query.name && !workflow.name.toLowerCase().includes(query.name.toLowerCase())) return false;
    return true;
  });
}
