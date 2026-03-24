"use client";

import { useEffect, useState } from "react";

interface Props {
  params: { runId: string };
}

interface RunDetail {
  run: {
    id: string;
    workflowId: string;
    status: string;
    errorSummary: string | null;
    createdAt: string;
  };
  steps: Array<{
    id: string;
    actionType: string;
    stepOrder: number;
    status: string;
    retryable: boolean;
    errorSummary: string | null;
    outputPayload: Record<string, unknown> | null;
  }>;
  logs: Array<{ id: string; message: string; level: string; createdAt: string }>;
}

export default function RunDetailPage({ params }: Props): JSX.Element {
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    const response = await fetch(`/api/logs/runs/${params.runId}`);
    if (!response.ok) {
      setError("Unable to load run.");
      return;
    }
    const body = (await response.json()) as { data: RunDetail };
    setDetail(body.data);
  }

  async function retryRun(): Promise<void> {
    const response = await fetch(`/api/logs/runs/${params.runId}/retry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (!response.ok) {
      setError("Unable to retry run.");
      return;
    }
    await load();
  }

  async function retryStep(stepId: string): Promise<void> {
    const response = await fetch(`/api/logs/runs/${params.runId}/steps/${stepId}/retry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (!response.ok) {
      setError("Unable to retry step.");
      return;
    }
    await load();
  }

  useEffect(() => {
    void load();
  }, [params.runId]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Run {params.runId}</h1>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {detail ? (
        <>
          <div className="rounded border border-slate-200 p-3 text-sm">
            <p>Status: <span className="rounded bg-slate-100 px-2 py-1 text-xs">{detail.run.status}</span></p>
            <p>Workflow: {detail.run.workflowId}</p>
            <p>Created: {detail.run.createdAt}</p>
            {detail.run.errorSummary ? <p className="text-red-700">Error: {detail.run.errorSummary}</p> : null}
            <button onClick={() => void retryRun()} className="mt-2 rounded border border-slate-300 px-3 py-1.5 text-sm">Retry run</button>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-medium">Steps</h2>
            {detail.steps.map((step) => (
              <div key={step.id} className="rounded border border-slate-200 p-3 text-sm">
                <p>#{step.stepOrder} {step.actionType} • <span className="rounded bg-slate-100 px-2 py-1 text-xs">{step.status}</span></p>
                {step.errorSummary ? <p className="text-red-700">{step.errorSummary}</p> : null}
                <pre className="mt-2 overflow-auto rounded bg-slate-900 p-2 text-xs text-slate-100">{JSON.stringify(step.outputPayload ?? {}, null, 2)}</pre>
                <button onClick={() => void retryStep(step.id)} disabled={!step.retryable} className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-50">Retry step</button>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-medium">Logs</h2>
            <ul className="space-y-1 text-sm">
              {detail.logs.map((log) => (
                <li key={log.id} className="rounded border border-slate-200 p-2">[{log.level}] {log.createdAt} — {log.message}</li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </section>
  );
}
