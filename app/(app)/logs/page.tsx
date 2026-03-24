"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LogRow {
  id: string;
  runId: string;
  stepId: string | null;
  level: "info" | "warn" | "error";
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export default function LogsPage(): JSX.Element {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [workflowId, setWorkflowId] = useState("");
  const [status, setStatus] = useState("");
  const [actionType, setActionType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [advancedLogs, setAdvancedLogs] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    const params = new URLSearchParams({ workflowId, status, actionType, dateFrom, dateTo, q: query });
    const response = await fetch(`/api/logs?${params.toString()}`);
    if (!response.ok) {
      setLogs([]);
      setLoading(false);
      return;
    }
    const body = (await response.json()) as { data: LogRow[]; meta?: { advancedLogs?: boolean } };
    setLogs(body.data);
    setAdvancedLogs(body.meta?.advancedLogs ?? true);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Logs</h1>
        <p className="mt-1 text-sm text-slate-600">Filter recent workflow runs and drill into step-level details.</p>
      </div>

      {!advancedLogs ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">Advanced log filters are locked on Free plan. Upgrade to Starter for full filtering.</p> : null}

      <Card className="grid gap-2 md:grid-cols-6">
        <input value={workflowId} onChange={(e) => setWorkflowId(e.target.value)} placeholder="Workflow ID" className="rounded border border-slate-300 px-2 py-1 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm"><option value="">All statuses</option><option value="queued">queued</option><option value="running">running</option><option value="success">success</option><option value="failed">failed</option><option value="partial_success">partial_success</option><option value="skipped">skipped</option></select>
        <input value={actionType} onChange={(e) => setActionType(e.target.value)} placeholder="Action type" className="rounded border border-slate-300 px-2 py-1 text-sm" />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search text" className="rounded border border-slate-300 px-2 py-1 text-sm" />
        <div className="md:col-span-6"><Button variant="secondary" onClick={() => void load()}>Apply filters</Button></div>
      </Card>

      {loading ? (
        <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : logs.length === 0 ? (
        <EmptyState title="No logs match your filters" description="Try broadening filters or running a workflow." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600"><tr><th className="px-3 py-2">Time</th><th className="px-3 py-2">Message</th><th className="px-3 py-2">Level</th><th className="px-3 py-2">Run</th><th className="px-3 py-2">Action</th></tr></thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-xs text-slate-500">{log.createdAt}</td>
                  <td className="px-3 py-2">{log.message}</td>
                  <td className="px-3 py-2"><Badge label={log.level} tone={log.level === "error" ? "danger" : log.level === "warn" ? "warning" : "neutral"} /></td>
                  <td className="px-3 py-2"><Link href={`/logs/${log.runId}`} className="text-blue-600">{log.runId}</Link></td>
                  <td className="px-3 py-2 text-xs text-slate-500">{log.stepId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
