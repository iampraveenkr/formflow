"use client";

import { summarizeCondition } from "@/services/workflows/engine";
import { useMemo } from "react";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "before_date"
  | "after_date";

export interface ConditionInput {
  workflowId?: string;
  fieldKey: string;
  operator: ConditionOperator;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
  groupId?: string;
}

interface Props {
  workflowId?: string;
  conditions: ConditionInput[];
  onChange: (conditions: ConditionInput[]) => void;
}

const operatorOptions: Array<{ value: ConditionOperator; label: string; valueType: "text" | "number" | "date" | "none" }> = [
  { value: "equals", label: "equals", valueType: "text" },
  { value: "not_equals", label: "not equals", valueType: "text" },
  { value: "contains", label: "contains", valueType: "text" },
  { value: "not_contains", label: "does not contain", valueType: "text" },
  { value: "is_empty", label: "is empty", valueType: "none" },
  { value: "is_not_empty", label: "is not empty", valueType: "none" },
  { value: "greater_than", label: "greater than", valueType: "number" },
  { value: "less_than", label: "less than", valueType: "number" },
  { value: "greater_than_or_equal", label: "greater than or equal", valueType: "number" },
  { value: "less_than_or_equal", label: "less than or equal", valueType: "number" },
  { value: "before_date", label: "before date", valueType: "date" },
  { value: "after_date", label: "after date", valueType: "date" }
];

function makeCondition(workflowId?: string): ConditionInput {
  return {
    workflowId,
    fieldKey: "",
    operator: "equals",
    valueText: ""
  };
}

export default function ConditionBuilder({ workflowId, conditions, onChange }: Props): JSX.Element {
  const rows = conditions.length ? conditions : [makeCondition(workflowId)];
  const optionsByValue = useMemo(() => new Map(operatorOptions.map((entry) => [entry.value, entry])), []);

  function update(index: number, patch: Partial<ConditionInput>): void {
    const next = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch, workflowId } : row));
    onChange(next);
  }

  function add(): void {
    onChange([...rows, makeCondition(workflowId)]);
  }

  function remove(index: number): void {
    const next = rows.filter((_, rowIndex) => rowIndex !== index);
    onChange(next.length ? next : [makeCondition(workflowId)]);
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-200 p-3">
      <h3 className="text-sm font-semibold">Conditions</h3>
      {rows.map((condition, index) => {
        const operatorMeta = optionsByValue.get(condition.operator) ?? operatorOptions[0];

        return (
          <div key={`${condition.fieldKey}-${index}`} className="grid gap-2 rounded-md border border-slate-200 p-2 md:grid-cols-12">
            <input
              value={condition.fieldKey}
              onChange={(event) => update(index, { fieldKey: event.target.value })}
              placeholder="field key"
              className="rounded-md border border-slate-300 px-2 py-1 text-sm md:col-span-3"
            />
            <select
              value={condition.operator}
              onChange={(event) => update(index, { operator: event.target.value as ConditionOperator, valueText: "", valueNumber: undefined, valueDate: "" })}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm md:col-span-3"
            >
              {operatorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {operatorMeta.valueType === "text" ? (
              <input
                value={condition.valueText ?? ""}
                onChange={(event) => update(index, { valueText: event.target.value })}
                placeholder="value"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm md:col-span-4"
              />
            ) : null}
            {operatorMeta.valueType === "number" ? (
              <input
                type="number"
                value={condition.valueNumber ?? ""}
                onChange={(event) => update(index, { valueNumber: event.target.value === "" ? undefined : Number(event.target.value) })}
                placeholder="number value"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm md:col-span-4"
              />
            ) : null}
            {operatorMeta.valueType === "date" ? (
              <input
                type="date"
                value={condition.valueDate ?? ""}
                onChange={(event) => update(index, { valueDate: event.target.value })}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm md:col-span-4"
              />
            ) : null}
            {operatorMeta.valueType === "none" ? <div className="md:col-span-4" /> : null}
            <button onClick={() => remove(index)} className="rounded-md border border-slate-300 px-2 py-1 text-sm md:col-span-2">
              Remove
            </button>
            <p className="text-xs text-slate-600 md:col-span-12">{summarizeCondition(condition)}</p>
          </div>
        );
      })}

      <button onClick={add} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
        Add condition
      </button>
    </div>
  );
}
