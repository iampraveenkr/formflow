"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EditPageProps {
  params: { id: string };
}

export default function EditWorkflowPage({ params }: EditPageProps): JSX.Element {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "paused" | "archived">("draft");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load(): Promise<void> {
      const response = await fetch(`/api/workflows/${params.id}`);
      if (!response.ok) return;
      const body = (await response.json()) as { data: { name: string; description: string | null; status: "draft" | "active" | "paused" | "archived" } };
      setName(body.data.name);
      setDescription(body.data.description ?? "");
      setStatus(body.data.status);
    }

    void load();
  }, [params.id]);

  async function save(): Promise<void> {
    setError(null);
    const response = await fetch(`/api/workflows/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, status })
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Unable to save");
      return;
    }

    router.push(`/workflows/${params.id}`);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Edit workflow</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "active" | "paused" | "archived")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="archived">Archived</option>
      </select>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button onClick={() => void save()} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Save changes
      </button>
    </section>
  );
}
