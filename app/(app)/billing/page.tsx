"use client";

import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";

interface Plan {
  id: "free" | "starter" | "pro";
  name: string;
  maxWorkflows: number;
  maxRunsPerMonth: number;
  maxConnectedAccounts: number;
  availableActions: string[];
  accessToTemplates: boolean;
  accessToAdvancedLogs: boolean;
  supportLevel: string;
}

interface BillingSummary {
  plan: Plan;
  plans: Plan[];
  subscription: { status: string; trialEndsAt: string | null; graceUntil: string | null };
  usage: { runs: number; workflows: number; connectedAccounts: number; monthKey: string };
}

export default function BillingPage(): JSX.Element {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    const response = await fetch("/api/billing/summary");
    if (!response.ok) {
      setBanner({ tone: "error", message: "Unable to load billing summary." });
      setLoading(false);
      return;
    }
    const body = (await response.json()) as { data: BillingSummary };
    setSummary(body.data);
    setLoading(false);
  }

  async function upgrade(planId: Plan["id"]): Promise<void> {
    const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
    if (!response.ok) {
      setBanner({ tone: "error", message: "Checkout placeholder failed." });
      return;
    }
    setBanner({ tone: "success", message: `Plan changed to ${planId}.` });
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  const usagePercent = useMemo(() => {
    if (!summary) return 0;
    return Math.min(100, Math.round((summary.usage.runs / summary.plan.maxRunsPerMonth) * 100));
  }, [summary]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Billing & plans</h1>
        <p className="mt-1 text-sm text-slate-600">Manage plan limits, usage, and upgrade options.</p>
      </div>
      {banner ? <Banner tone={banner.tone} message={banner.message} /> : null}

      {loading || !summary ? (
        <div className="space-y-2"><Skeleton className="h-28" /><Skeleton className="h-20" /></div>
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Current plan</p>
                <div className="mt-1 flex items-center gap-2"><p className="text-xl font-semibold">{summary.plan.name}</p><Badge label={summary.subscription.status} tone={summary.subscription.status === "active" ? "success" : "warning"} /></div>
                {summary.subscription.graceUntil ? <p className="mt-1 text-xs text-amber-700">Grace period until {summary.subscription.graceUntil}</p> : null}
              </div>
              <div className="text-right text-sm text-slate-600">
                <p>Support: {summary.plan.supportLevel}</p>
                <p>Advanced logs: {summary.plan.accessToAdvancedLogs ? "Enabled" : "Locked"}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-500">Run usage ({summary.usage.monthKey})</p>
              <div className="h-2 w-full rounded bg-slate-100"><div className="h-2 rounded bg-slate-900" style={{ width: `${usagePercent}%` }} /></div>
              <p className="text-xs text-slate-600">{summary.usage.runs} / {summary.plan.maxRunsPerMonth} runs</p>
              <p className="text-xs text-slate-600">Workflows: {summary.usage.workflows} / {summary.plan.maxWorkflows} • Accounts: {summary.usage.connectedAccounts} / {summary.plan.maxConnectedAccounts}</p>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {summary.plans.map((plan) => {
              const current = plan.id === summary.plan.id;
              return (
                <Card key={plan.id} className="space-y-2">
                  <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{plan.name}</h2>{current ? <Badge label="Current" tone="success" /> : null}</div>
                  <ul className="text-xs text-slate-600">
                    <li>Max workflows: {plan.maxWorkflows}</li>
                    <li>Max runs/month: {plan.maxRunsPerMonth}</li>
                    <li>Max accounts: {plan.maxConnectedAccounts}</li>
                    <li>Templates: {plan.accessToTemplates ? "Yes" : "No"}</li>
                    <li>Advanced logs: {plan.accessToAdvancedLogs ? "Yes" : "No"}</li>
                  </ul>
                  <p className="text-xs text-slate-500">Actions: {plan.availableActions.join(", ")}</p>
                  <Button variant={current ? "secondary" : "primary"} disabled={current} onClick={() => void upgrade(plan.id)}>{current ? "Current plan" : "Upgrade"}</Button>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
