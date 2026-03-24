"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useEffect, useState } from "react";

interface OverviewData {
  activeWorkflows: number;
  recentRuns: Array<{ id: string; workflowId: string; status: string; createdAt: string }>;
  successRate: number;
  connectedIntegrations: number;
  latestErrors: Array<{ id: string; runId: string; message: string; createdAt: string }>;
}

export default function DashboardPage(): JSX.Element {
  const [data, setData] = useState<OverviewData | null>(null);

  async function load(): Promise<void> {
    const response = await fetch("/api/dashboard/overview");
    if (!response.ok) return;
    const body = (await response.json()) as { data: OverviewData };
    setData(body.data);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="mt-1 text-sm text-slate-600">Track workflow health, activity, and integration status.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/workflows/new"><Button>Create workflow</Button></Link>
          <Link href="/integrations"><Button variant="secondary">Manage integrations</Button></Link>
        </div>
      </div>

      {!data ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><p className="text-xs text-slate-500">Active workflows</p><p className="mt-2 text-2xl font-semibold">{data.activeWorkflows}</p></Card>
          <Card><p className="text-xs text-slate-500">Success rate</p><p className="mt-2 text-2xl font-semibold">{data.successRate}%</p></Card>
          <Card><p className="text-xs text-slate-500">Connected integrations</p><p className="mt-2 text-2xl font-semibold">{data.connectedIntegrations}</p></Card>
          <Card><p className="text-xs text-slate-500">Recent errors</p><p className="mt-2 text-2xl font-semibold">{data.latestErrors.length}</p></Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Recent runs</h2>
          {!data || data.recentRuns.length === 0 ? (
            <EmptyState title="No runs yet" description="Run your first workflow to see execution history." action={<Link href="/workflows"><Button variant="secondary">Open workflows</Button></Link>} />
          ) : (
            <ul className="mt-3 space-y-2">
              {data.recentRuns.map((run) => (
                <li key={run.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 text-sm">
                  <div>
                    <p className="font-medium">{run.workflowId}</p>
                    <p className="text-xs text-slate-500">{run.createdAt}</p>
                  </div>
                  <Badge label={run.status} tone={run.status === "success" ? "success" : run.status.includes("fail") ? "danger" : "warning"} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Latest errors</h2>
          {!data || data.latestErrors.length === 0 ? (
            <EmptyState title="No errors" description="Everything looks healthy right now." />
          ) : (
            <ul className="mt-3 space-y-2">
              {data.latestErrors.map((error) => (
                <li key={error.id} className="rounded-md border border-red-100 bg-red-50 p-2 text-sm">
                  <p className="font-medium text-red-700">{error.message}</p>
                  <p className="text-xs text-red-600">Run: {error.runId} • {error.createdAt}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}
