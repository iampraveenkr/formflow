const forms = new Map();
const formFields = new Map();
const workflowFormSelection = new Map();

function keyForForm(workspaceId, googleFormId) {
  return `${workspaceId}:${googleFormId}`;
}

function keyForWorkflow(workspaceId, workflowId) {
  return `${workspaceId}:${workflowId}`;
}

export async function upsertFormCache(form) {
  forms.set(keyForForm(form.workspaceId, form.googleFormId), form);
  return form;
}

export async function setWorkflowForm(workspaceId, workflowId, formId) {
  workflowFormSelection.set(keyForWorkflow(workspaceId, workflowId), formId);
}

export async function getWorkflowForm(workspaceId, workflowId) {
  const formId = workflowFormSelection.get(keyForWorkflow(workspaceId, workflowId));
  if (!formId) return null;
  for (const form of forms.values()) {
    if (form.id === formId && form.workspaceId === workspaceId) return form;
  }
  return null;
}

export async function listFormsByWorkspace(workspaceId) {
  return Array.from(forms.values()).filter((form) => form.workspaceId === workspaceId);
}

export async function saveFormFields(workspaceId, formId, incomingFields) {
  const existing = formFields.get(formId) ?? [];
  const existingByExternalId = new Map(existing.map((field) => [field.externalFieldId, field]));

  const next = incomingFields.map((field) => {
    const previous = existingByExternalId.get(field.externalFieldId);
    return {
      ...field,
      workspaceId,
      formId,
      internalFieldKey: previous?.internalFieldKey ?? field.stableKey,
      removed: false
    };
  });

  const incomingIds = new Set(incomingFields.map((field) => field.externalFieldId));
  const removed = existing
    .filter((field) => !incomingIds.has(field.externalFieldId))
    .map((field) => ({ ...field, removed: true }));

  const merged = [...next, ...removed];
  formFields.set(formId, merged);
  return merged;
}

export async function updateFieldMapping(formId, externalFieldId, internalFieldKey) {
  const existing = formFields.get(formId) ?? [];
  const updated = existing.map((field) => (field.externalFieldId === externalFieldId ? { ...field, internalFieldKey } : field));
  formFields.set(formId, updated);
  return updated;
}

export async function listFormFields(formId) {
  return formFields.get(formId) ?? [];
}
