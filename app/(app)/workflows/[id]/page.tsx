"use client";

import { summarizeCondition } from "@/services/workflows/engine";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface WorkflowPageProps {
  params: {
    id: string;
  };
}

interface WorkflowCondition {
  workflowId?: string;
  fieldKey: string;
  operator:
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
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
  groupId?: string;
}

interface WorkflowMeta {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused" | "archived";
  conditionMode: "all" | "any";
  conditions: WorkflowCondition[];
}

interface GoogleFormOption {
  googleFormId: string;
  title: string;
}

interface FieldRow {
  externalFieldId: string;
  label: string;
  normalizedType: string;
  internalFieldKey: string;
  removed: boolean;
}

export default function WorkflowDetailPage({ params }: WorkflowPageProps): JSX.Element {
  const workflowId = params.id;
  const [workflow, setWorkflow] = useState<WorkflowMeta | null>(null);
  const [googleForms, setGoogleForms] = useState<GoogleFormOption[]>([]);
  const [selectedGoogleFormId, setSelectedGoogleFormId] = useState("");
  const [formId, setFormId] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [rawSchema, setRawSchema] = useState<Record<string, unknown> | null>(null);
  const [previewPayload, setPreviewPayload] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasConnectedForms = googleForms.length > 0;
  const schemaPreview = useMemo(() => JSON.stringify(rawSchema ?? {}, null, 2), [rawSchema]);

  async function loadInitialData(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);

    const [workflowResponse, formsResponse, mappingResponse] = await Promise.all([
      fetch(`/api/workflows/${workflowId}`),
      fetch("/api/forms/google"),
      fetch(`/api/forms/workflow?workflowId=${encodeURIComponent(workflowId)}`)
    ]);

    if (!workflowResponse.ok || !formsResponse.ok || !mappingResponse.ok) {
      setErrorMessage("Unable to load workflow data.");
      setIsLoading(false);
      return;
    }

    const workflowBody = (await workflowResponse.json()) as { data: WorkflowMeta };
    const formsBody = (await formsResponse.json()) as { forms: GoogleFormOption[] };
    const mappingBody = (await mappingResponse.json()) as {
      selectedForm: { id: string; googleFormId: string; schemaJson: Record<string, unknown> } | null;
      fields: FieldRow[];
      previewPayload: Record<string, unknown>;
    };

    setWorkflow(workflowBody.data);
    setGoogleForms(formsBody.forms);
    setFormId(mappingBody.selectedForm?.id ?? null);
    setSelectedGoogleFormId(mappingBody.selectedForm?.googleFormId ?? formsBody.forms[0]?.googleFormId ?? "");
    setFields(mappingBody.fields);
    setRawSchema(mappingBody.selectedForm?.schemaJson ?? null);
    setPreviewPayload(mappingBody.previewPayload);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadInitialData();
  }, [workflowId]);

  async function patchWorkflow(payload: Record<string, unknown>): Promise<void> {
    const response = await fetch(`/api/workflows/${workflowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setErrorMessage(body.error ?? "Unable to update workflow.");
      return;
    }

    await loadInitialData();
  }

  async function handleDuplicate(): Promise<void> {
    const response = await fetch(`/api/workflows/${workflowId}/duplicate`, { method: "POST" });
    if (!response.ok) {
      setErrorMessage("Unable to duplicate workflow.");
      return;
    }
  }

  async function handleRunCheck(): Promise<void> {
    const response = await fetch(`/api/workflows/${workflowId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission: previewPayload, idempotencyKey: `preview-${workflowId}-${Date.now()}`, source: "webhook" })
    });

    if (!response.ok) {
      setErrorMessage("Unable to evaluate workflow run.");
      return;
    }

    const body = (await response.json()) as { data: { shouldRun: boolean } };
    setRunResult(body.data.shouldRun ? "Conditions passed: workflow would run." : "Conditions failed: workflow would not run.");
  }

  async function handleSync(): Promise<void> {
    if (!selectedGoogleFormId) {
      setErrorMessage("Please select a Google Form first.");
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);

    const response = await fetch("/api/forms/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId, googleFormId: selectedGoogleFormId })
    });

    setIsSyncing(false);

    if (!response.ok) {
      setErrorMessage("Sync failed.");
      return;
    }

    const body = (await response.json()) as {
      form: { id: string; schemaJson: Record<string, unknown> };
      fields: FieldRow[];
    };

    setFormId(body.form.id);
    setRawSchema(body.form.schemaJson);
    setFields(body.fields);
  }

  async function handleFieldMappingChange(externalFieldId: string, internalFieldKey: string): Promise<void> {
    if (!formId) return;

    setFields((current) => current.map((field) => (field.externalFieldId === externalFieldId ? { ...field, internalFieldKey } : field)));

    await fetch("/api/forms/map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId, externalFieldId, internalFieldKey })
    });
  }

  async function handleGeneratePreview(): Promise<void> {
    setIsPreviewLoading(true);

    const response = await fetch("/api/forms/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId })
    });

    setIsPreviewLoading(false);

    if (!response.ok) {
      setErrorMessage("Unable to generate preview payload.");
      return;
    }

    const body = (await response.json()) as { previewPayload: Record<string, unknown> };
    setPreviewPayload(body.previewPayload);
  }

  if (isLoading) return <p className="text-sm text-slate-600">Loading workflow...</p>;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{workflow?.name ?? `Workflow ${workflowId}`}</h1>
          <p className="mt-1 text-sm text-slate-600">{workflow?.description ?? "No description."}</p>
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{workflow?.status}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/workflows/${workflowId}/edit`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">Edit</Link>
          <button onClick={() => void handleDuplicate()} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">Duplicate</button>
          <button onClick={() => void patchWorkflow({ status: "active" })} className="rounded-md border border-green-300 px-3 py-1.5 text-sm text-green-700">Activate</button>
          <button onClick={() => void patchWorkflow({ status: "paused" })} className="rounded-md border border-amber-300 px-3 py-1.5 text-sm text-amber-700">Pause</button>
          <button onClick={() => void patchWorkflow({ status: "archived" })} className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700">Archive</button>
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Condition mode: {workflow?.conditionMode}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {(workflow?.conditions ?? []).map((condition, index) => (
            <li key={`${condition.fieldKey}-${index}`}>{summarizeCondition(condition)}</li>
          ))}
        </ul>
        <button onClick={() => void handleRunCheck()} className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-sm">Evaluate with preview payload</button>
        {runResult ? <p className="mt-2 text-sm text-slate-700">{runResult}</p> : null}
      </div>

      {!hasConnectedForms ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No accessible Google Forms found.</div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select value={selectedGoogleFormId} onChange={(e) => setSelectedGoogleFormId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {googleForms.map((form) => (
                <option key={form.googleFormId} value={form.googleFormId}>{form.title}</option>
              ))}
            </select>
            <button onClick={() => void handleSync()} disabled={isSyncing} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{isSyncing ? "Syncing..." : "Sync form schema"}</button>
            <button onClick={() => void handleGeneratePreview()} disabled={isPreviewLoading} className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-60">{isPreviewLoading ? "Generating..." : "Test submission"}</button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Field mapping</h2>
        {fields.length === 0 ? <p className="mt-2 text-sm text-slate-600">No fields synced yet.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left"><th className="pb-2 pr-4">Label</th><th className="pb-2 pr-4">Type</th><th className="pb-2 pr-4">Internal key</th><th className="pb-2">Status</th></tr></thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field.externalFieldId} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{field.label}</td>
                    <td className="py-2 pr-4">{field.normalizedType}</td>
                    <td className="py-2 pr-4"><input value={field.internalFieldKey} onChange={(e) => void handleFieldMappingChange(field.externalFieldId, e.target.value)} className="rounded-md border border-slate-300 px-2 py-1" /></td>
                    <td className="py-2">{field.removed ? "Removed" : "Active"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h2 className="text-lg font-medium">Raw schema preview</h2><pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{schemaPreview}</pre></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h2 className="text-lg font-medium">Test payload preview</h2><pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(previewPayload, null, 2)}</pre></div>
      </div>
    </section>
  );
}
