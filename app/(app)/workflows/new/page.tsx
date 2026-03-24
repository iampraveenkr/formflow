"use client";

import ConditionBuilder, { type ConditionInput } from "@/components/workflows/condition-builder";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ActionInput {
  actionType: "send_email" | "call_webhook" | "send_slack_message";
  step_order: number;
  config: Record<string, unknown>;
}

export default function NewWorkflowPage(): JSX.Element {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<"form_submission" | "webhook">("form_submission");
  const [formId, setFormId] = useState("");
  const [conditionMode, setConditionMode] = useState<"all" | "any">("all");
  const [conditions, setConditions] = useState<ConditionInput[]>([]);
  const [actions, setActions] = useState<ActionInput[]>([{ actionType: "send_email", step_order: 1, config: { to: "{{email}}", subject: "New submission", body: "Received from {{first_name}}" } }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  function updateAction(index: number, patch: Partial<ActionInput>): void {
    setActions((current) => current.map((action, actionIndex) => (actionIndex === index ? { ...action, ...patch } : action)));
  }

  async function submit(status: "draft" | "active"): Promise<void> {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        triggerType,
        formId: triggerType === "form_submission" ? formId : null,
        conditionMode,
        conditions,
        actions,
        status,
        settingsJson: {}
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Unable to create workflow");
      return;
    }

    const body = (await response.json()) as { data: { id: string } };
    if (status === "draft") {
      setSuccess("Draft saved. Redirecting to workflow detail...");
    }
    router.push(`/workflows/${body.data.id}`);
  }

  async function testWorkflow(): Promise<void> {
    setSuccess("Test payload generated. Save workflow to run a full execution.");
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Create workflow</h1>
        <p className="text-sm text-slate-600">Set trigger, conditions, and actions in one clean builder.</p>
      </div>

      {error ? <Banner message={error} tone="error" /> : null}
      {success ? <Banner message={success} tone="success" /> : null}

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Trigger</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={triggerType} onChange={(e) => setTriggerType(e.target.value as "form_submission" | "webhook")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="form_submission">Form submission</option>
          <option value="webhook">Webhook</option>
        </select>
        {triggerType === "form_submission" ? <input value={formId} onChange={(e) => setFormId(e.target.value)} placeholder="Form ID" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /> : null}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Conditions</h2>
        <select value={conditionMode} onChange={(e) => setConditionMode(e.target.value as "all" | "any")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All conditions must match</option>
          <option value="any">Any condition can match</option>
        </select>
        <ConditionBuilder conditions={conditions} onChange={setConditions} />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Actions</h2>
        {actions.map((action, index) => (
          <div key={index} className="rounded-md border border-slate-200 p-3">
            <div className="grid gap-2 md:grid-cols-3">
              <input value={action.step_order} type="number" onChange={(e) => updateAction(index, { step_order: Number(e.target.value) })} className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
              <select value={action.actionType} onChange={(e) => updateAction(index, { actionType: e.target.value as ActionInput["actionType"] })} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                <option value="send_email">send_email</option>
                <option value="call_webhook">call_webhook</option>
                <option value="send_slack_message">send_slack_message</option>
              </select>
              <input value={String(action.config.summary ?? "")}
                onChange={(e) => updateAction(index, { config: { ...action.config, summary: e.target.value } })}
                placeholder="Action summary"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm" />
            </div>
          </div>
        ))}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void testWorkflow()}>Test workflow</Button>
        <Button variant="secondary" onClick={() => void submit("draft")} disabled={isSubmitting}>Save draft</Button>
        <Button onClick={() => void submit("active")} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Activate"}</Button>
      </div>
    </section>
  );
}
