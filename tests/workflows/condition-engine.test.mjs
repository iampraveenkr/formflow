import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCondition, evaluateWorkflowConditions } from "../../services/workflows/engine.mjs";
import { validateCondition, validateConditions } from "../../services/workflows/validation.mjs";

const wf = "wf_demo";

test("equals operator is case-insensitive", () => {
  assert.equal(
    evaluateCondition({ workflowId: wf, fieldKey: "email", operator: "equals", valueText: "USER@example.com" }, { email: "user@example.com" }),
    true
  );
});

test("not equals operator", () => {
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "name", operator: "not_equals", valueText: "bob" }, { name: "alice" }), true);
});

test("contains and not contains operators", () => {
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "note", operator: "contains", valueText: "urgent" }, { note: "Very URGENT issue" }), true);
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "note", operator: "not_contains", valueText: "spam" }, { note: "Important" }), true);
});

test("is empty and is not empty with missing fields", () => {
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "missing", operator: "is_empty" }, {}), true);
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "missing", operator: "is_not_empty" }, {}), false);
});

test("number comparisons are strict and support string numbers like 0012", () => {
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "qty", operator: "greater_than", valueNumber: 11 }, { qty: "0012" }), true);
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "qty", operator: "less_than", valueNumber: 11 }, { qty: "abc" }), false);
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "qty", operator: "greater_than_or_equal", valueNumber: 12 }, { qty: "12" }), true);
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "qty", operator: "less_than_or_equal", valueNumber: 12 }, { qty: 12 }), true);
});

test("date comparisons reject malformed date", () => {
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "submittedAt", operator: "before_date", valueDate: "2026-03-25" }, { submittedAt: "2026-03-24" }), true);
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "submittedAt", operator: "after_date", valueDate: "bad-date" }, { submittedAt: "2026-03-24" }), false);
});

test("all vs any condition mode", () => {
  const conditions = [
    { workflowId: wf, fieldKey: "email", operator: "contains", valueText: "@" },
    { workflowId: wf, fieldKey: "priority", operator: "equals", valueText: "high" }
  ];

  assert.equal(evaluateWorkflowConditions("all", conditions, { email: "a@b.com", priority: "HIGH" }), true);
  assert.equal(evaluateWorkflowConditions("all", conditions, { email: "a@b.com", priority: "low" }), false);
  assert.equal(evaluateWorkflowConditions("any", conditions, { email: "invalid", priority: "high" }), true);
});

test("empty submission payload and mixed-type comparisons", () => {
  assert.equal(evaluateWorkflowConditions("all", [{ workflowId: wf, fieldKey: "x", operator: "is_empty" }], {}), true);
  assert.equal(evaluateCondition({ workflowId: wf, fieldKey: "date", operator: "greater_than", valueNumber: 2 }, { date: "2026-01-01" }), false);
});

test("condition validation rejects invalid inputs", () => {
  assert.equal(validateCondition({ workflowId: wf, fieldKey: "", operator: "equals", valueText: "x" }, wf), "Condition fieldKey is required.");
  assert.equal(validateCondition({ workflowId: wf, fieldKey: "x", operator: "equals" }, wf), "valueText is required for equals.");
  assert.equal(validateCondition({ workflowId: wf, fieldKey: "x", operator: "before_date", valueDate: "not-a-date" }, wf), "valueDate must be a valid date for before_date.");
});

test("duplicate conditions are rejected", () => {
  const conditions = [
    { workflowId: wf, fieldKey: "email", operator: "contains", valueText: "@" },
    { workflowId: wf, fieldKey: "email", operator: "contains", valueText: "@" }
  ];
  assert.equal(validateConditions(conditions, wf), "Duplicate conditions are not allowed.");
});
