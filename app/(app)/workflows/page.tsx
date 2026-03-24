"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface WorkflowRow {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "archived";
  formId: string | null;
  triggerType: string;
}

export default function WorkflowsPage(): JSX.Element {
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchFormId, setSearchFormId] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadRows(): Promise<void> {
    setLoading(true);
    const params = new URLSearchParams({
      name: searchName,
      status: searchStatus,
      formId: searchFormId
    });

    const response = await fetch(`/api/workflows?${params.toString()}`);
    if (!response.ok) {
      setWorkflows([]);
      setLoading(false);
      return;
    }

    const body = (await response.json()) as { data: WorkflowRow[] };
    setWorkflows(body.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadRows();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workflows</h1>
          <p className="mt-1 text-sm text-slate-600">Create, search, and manage workflow lifecycle states.</p>
        </div>
        <Link href="/workflows/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Create workflow
        </Link>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Search by name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input value={searchFormId} onChange={(e) => setSearchFormId(e.target.value)} placeholder="Search by form id" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={() => void loadRows()} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          Search
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading workflows...</p>
      ) : workflows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No workflows found. Create your first workflow.</div>
      ) : (
        <ul className="space-y-2">
          {workflows.map((workflow) => (
            <li key={workflow.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{workflow.name}</p>
                  <p className="text-xs text-slate-500">Trigger: {workflow.triggerType} {workflow.formId ? `• Form: ${workflow.formId}` : ""}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{workflow.status}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/workflows/${workflow.id}`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                  View
                </Link>
                <Link href={`/workflows/${workflow.id}/edit`} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
