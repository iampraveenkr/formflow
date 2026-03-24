export function validateWorkflowInput(input) {
  if (!input.name || input.name.trim().length < 3) {
    return "Workflow name must be at least 3 characters.";
  }

  if (!input.triggerType) {
    return "triggerType is required.";
  }

  if (input.triggerType === "form_submission" && !input.formId) {
    return "formId is required for form_submission trigger.";
  }

  if (!Array.isArray(input.actions) || input.actions.length < 1) {
    return "At least one action is required.";
  }

  if (!["all", "any"].includes(input.conditionMode)) {
    return "conditionMode must be all or any.";
  }

  return null;
}

export function validateStatusTransition(currentStatus, nextStatus) {
  const allowed = {
    draft: ["active", "archived", "paused"],
    active: ["paused", "archived"],
    paused: ["active", "archived"],
    archived: []
  };

  if (currentStatus === nextStatus) return null;
  return allowed[currentStatus]?.includes(nextStatus) ? null : `Cannot change status from ${currentStatus} to ${nextStatus}.`;
}
