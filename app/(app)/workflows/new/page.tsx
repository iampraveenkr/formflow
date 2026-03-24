"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewWorkflowPage(): JSX.Element {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<"form_submission" | "webhook">("form_submission");
  const [formId, setFormId] = useState("");
  const [conditionMode, setConditionMode] = useState<"all" | "any">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        triggerType,
        formId: triggerType === "form_submission" ? formId : null,
        conditionMode,
        conditions: [],
        actions: [{ actionType: "send_email" }],
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
    router.push(`/workflows/${body.data.id}`);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Create workflow</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <select value={triggerType} onChange={(e) => setTriggerType(e.target.value as "form_submission" | "webhook")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="form_submission">Form submission</option>
        <option value="webhook">Webhook</option>
      </select>
      {triggerType === "form_submission" ? <input value={formId} onChange={(e) => setFormId(e.target.value)} placeholder="Form ID" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /> : null}
      <select value={conditionMode} onChange={(e) => setConditionMode(e.target.value as "all" | "any")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="all">All conditions must match</option>
        <option value="any">Any condition can match</option>
      </select>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button onClick={() => void submit()} disabled={isSubmitting} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {isSubmitting ? "Creating..." : "Create workflow"}
      </button>
    </section>
  );
}
