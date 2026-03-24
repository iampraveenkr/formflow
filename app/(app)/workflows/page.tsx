"use client";

import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [banner, setBanner] = useState<string | null>(null);

  async function loadRows(): Promise<void> {
    setLoading(true);
    setBanner(null);
    const params = new URLSearchParams({ name: searchName, status: searchStatus, formId: searchFormId });

    const response = await fetch(`/api/workflows?${params.toString()}`);
    if (!response.ok) {
      setWorkflows([]);
      setBanner("Unable to load workflows.");
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
          <p className="mt-1 text-sm text-slate-600">Build automations with clear status, triggers, and execution controls.</p>
        </div>
        <Link href="/workflows/new"><Button>Create workflow</Button></Link>
      </div>

      {banner ? <Banner message={banner} tone="error" /> : null}

      <Card className="grid gap-2 md:grid-cols-4">
        <input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Search by name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input value={searchFormId} onChange={(e) => setSearchFormId(e.target.value)} placeholder="Search by form id" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option>
        </select>
        <Button variant="secondary" onClick={() => void loadRows()}>Search</Button>
      </Card>

      {loading ? (
        <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : workflows.length === 0 ? (
        <EmptyState title="No workflows found" description="Create your first workflow and start automating submissions." action={<Link href="/workflows/new"><Button>Create workflow</Button></Link>} />
      ) : (
        <ul className="space-y-2">
          {workflows.map((workflow) => (
            <li key={workflow.id}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{workflow.name}</p>
                    <p className="text-xs text-slate-500">Trigger: {workflow.triggerType} {workflow.formId ? `• Form: ${workflow.formId}` : ""}</p>
                  </div>
                  <Badge label={workflow.status} tone={workflow.status === "active" ? "success" : workflow.status === "paused" ? "warning" : workflow.status === "archived" ? "danger" : "neutral"} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/workflows/${workflow.id}`}><Button variant="secondary">View</Button></Link>
                  <Link href={`/workflows/${workflow.id}/edit`}><Button variant="secondary">Edit</Button></Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
