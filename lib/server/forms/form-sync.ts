import { normalizeGoogleForm } from "@/lib/server/forms/google-forms";
import {
  findFormByIdWithinWorkspace,
  getWorkflowForm,
  listFormFields,
  listFormsByWorkspace,
  saveFormFields,
  setWorkflowForm,
  updateFieldMapping,
  upsertFormCache
} from "@/lib/server/db/forms-repo";
import { buildTestPayload } from "@/services/forms/parser";

export async function syncFormForWorkflow(input: { workspaceId: string; workflowId: string; googleFormId: string }) {
  const normalized = await normalizeGoogleForm(input.googleFormId);

  const form = await upsertFormCache({
    ...normalized.formRecord,
    workspaceId: input.workspaceId
  });

  const mergedFields = await saveFormFields(input.workspaceId, form.id, normalized.fields);
  await setWorkflowForm(input.workspaceId, input.workflowId, form.id);

  return {
    form,
    fields: mergedFields,
    changeSummary: {
      total: mergedFields.length,
      removed: mergedFields.filter((field) => field.removed).length
    }
  };
}

export async function getWorkflowFormMapping(input: { workspaceId: string; workflowId: string }) {
  const selectedForm = await getWorkflowForm(input.workspaceId, input.workflowId);
  const availableForms = await listFormsByWorkspace(input.workspaceId);

  if (!selectedForm) {
    return {
      selectedForm: null,
      fields: [],
      availableForms,
      previewPayload: {}
    };
  }

  const fields = await listFormFields(selectedForm.id);
  const previewPayload = buildTestPayload(fields.filter((field) => !field.removed));

  return {
    selectedForm,
    fields,
    availableForms,
    previewPayload
  };
}

export async function updateWorkflowFieldMapping(input: {
  workspaceId: string;
  formId: string;
  externalFieldId: string;
  internalFieldKey: string;
}) {
  const form = await findFormByIdWithinWorkspace(input.workspaceId, input.formId);
  if (!form) {
    return null;
  }

  const existingFields = await listFormFields(input.formId);
  const hasExternalField = existingFields.some((field) => field.externalFieldId === input.externalFieldId);
  if (!hasExternalField) {
    return null;
  }

  return updateFieldMapping(input.formId, input.externalFieldId, input.internalFieldKey);
}
