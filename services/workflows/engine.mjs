const TEXT_OPERATORS = new Set(["equals", "not_equals", "contains", "not_contains"]);
const NUMBER_OPERATORS = new Set(["greater_than", "less_than", "greater_than_or_equal", "less_than_or_equal"]);
const DATE_OPERATORS = new Set(["before_date", "after_date"]);
const EMPTY_OPERATORS = new Set(["is_empty", "is_not_empty"]);

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function parseStrictNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIsoDate(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}(?:[T\s].+)?$/.test(trimmed)) return null;
  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) return null;
  return timestamp;
}

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function evaluateCondition(condition, submission) {
  const fieldValue = submission?.[condition.fieldKey];

  if (EMPTY_OPERATORS.has(condition.operator)) {
    const empty = isEmptyValue(fieldValue);
    return condition.operator === "is_empty" ? empty : !empty;
  }

  if (TEXT_OPERATORS.has(condition.operator)) {
    const left = normalizeText(fieldValue);
    const right = normalizeText(condition.valueText ?? "");

    if (condition.operator === "equals") return left === right;
    if (condition.operator === "not_equals") return left !== right;
    if (condition.operator === "contains") return left.includes(right);
    return !left.includes(right);
  }

  if (NUMBER_OPERATORS.has(condition.operator)) {
    const left = parseStrictNumber(fieldValue);
    const right = typeof condition.valueNumber === "number" ? condition.valueNumber : null;
    if (left === null || right === null) return false;

    if (condition.operator === "greater_than") return left > right;
    if (condition.operator === "less_than") return left < right;
    if (condition.operator === "greater_than_or_equal") return left >= right;
    return left <= right;
  }

  if (DATE_OPERATORS.has(condition.operator)) {
    const left = parseIsoDate(typeof fieldValue === "string" ? fieldValue : "");
    const right = parseIsoDate(condition.valueDate ?? "");
    if (left === null || right === null) return false;

    if (condition.operator === "before_date") return left < right;
    return left > right;
  }

  return false;
}

export function evaluateWorkflowConditions(conditionMode, conditions, submission) {
  if (!Array.isArray(conditions) || conditions.length === 0) return true;

  const results = conditions.map((condition) => evaluateCondition(condition, submission ?? {}));
  if (conditionMode === "any") return results.some(Boolean);
  return results.every(Boolean);
}

export function summarizeCondition(condition) {
  const fieldLabel = condition.fieldKey || "(unknown field)";
  const valueText = condition.valueText ?? "";

  const labels = {
    equals: `equals \"${valueText}\"`,
    not_equals: `does not equal \"${valueText}\"`,
    contains: `contains \"${valueText}\"`,
    not_contains: `does not contain \"${valueText}\"`,
    is_empty: "is empty",
    is_not_empty: "is not empty",
    greater_than: `is greater than ${condition.valueNumber}`,
    less_than: `is less than ${condition.valueNumber}`,
    greater_than_or_equal: `is greater than or equal to ${condition.valueNumber}`,
    less_than_or_equal: `is less than or equal to ${condition.valueNumber}`,
    before_date: `is before ${condition.valueDate}`,
    after_date: `is after ${condition.valueDate}`
  };

  return `${fieldLabel} ${labels[condition.operator] ?? "has invalid operator"}`;
}

export { parseStrictNumber, parseIsoDate };
