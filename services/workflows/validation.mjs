import { validateActionConfig } from "./actions.mjs";
import { parseIsoDate } from "./engine.mjs";

const SUPPORTED_OPERATORS = new Set([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "is_empty",
  "is_not_empty",
  "greater_than",
  "less_than",
  "greater_than_or_equal",
  "less_than_or_equal",
  "before_date",
  "after_date"
]);

const TEXT_OPERATORS = new Set(["equals", "not_equals", "contains", "not_contains"]);
const NUMBER_OPERATORS = new Set(["greater_than", "less_than", "greater_than_or_equal", "less_than_or_equal"]);
const DATE_OPERATORS = new Set(["before_date", "after_date"]);

export function validateCondition(condition, workflowId) {
  if (!condition || typeof condition !== "object") return "Condition must be an object.";
  if (!condition.fieldKey || typeof condition.fieldKey !== "string") return "Condition fieldKey is required.";
  if (!condition.operator || !SUPPORTED_OPERATORS.has(condition.operator)) return "Condition operator is invalid.";
  if (condition.workflowId && condition.workflowId !== workflowId) return "Condition workflowId must match workflow.";

  if (TEXT_OPERATORS.has(condition.operator)) {
    if (typeof condition.valueText !== "string") return `valueText is required for ${condition.operator}.`;
  }

  if (NUMBER_OPERATORS.has(condition.operator)) {
    if (typeof condition.valueNumber !== "number" || !Number.isFinite(condition.valueNumber)) {
      return `valueNumber must be a finite number for ${condition.operator}.`;
    }
  }

  if (DATE_OPERATORS.has(condition.operator)) {
    if (typeof condition.valueDate !== "string" || parseIsoDate(condition.valueDate) === null) {
      return `valueDate must be a valid date for ${condition.operator}.`;
    }
  }

  return null;
}

export function validateConditions(conditions, workflowId) {
  if (!Array.isArray(conditions)) return "conditions must be an array.";

  const seen = new Set();
  for (const condition of conditions) {
    const error = validateCondition(condition, workflowId);
    if (error) return error;

    const key = JSON.stringify({
      fieldKey: condition.fieldKey,
      operator: condition.operator,
      valueText: condition.valueText ?? null,
      valueNumber: condition.valueNumber ?? null,
      valueDate: condition.valueDate ?? null,
      groupId: condition.groupId ?? null
    });

    if (seen.has(key)) return "Duplicate conditions are not allowed.";
    seen.add(key);
  }

  return null;
}

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

  for (const action of input.actions) {
    const actionError = validateActionConfig(action);
    if (actionError) return actionError;
  }

  if (!["all", "any"].includes(input.conditionMode)) {
    return "conditionMode must be all or any.";
  }

  const conditionsError = validateConditions(input.conditions ?? [], input.workflowId ?? null);
  if (conditionsError) return conditionsError;

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
