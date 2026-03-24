"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage(): JSX.Element {
  const [workspaceName, setWorkspaceName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceName, businessName })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setErrorMessage("Unable to complete onboarding. Please check your details and try again.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Set up your workspace</h1>
      <p className="mt-2 text-sm text-slate-600">Tell us your workspace and business or team name.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="workspaceName">
            Workspace name
          </label>
          <input
            id="workspaceName"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="businessName">
            Business or team name
          </label>
          <input
            id="businessName"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            required
          />
        </div>

        {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Complete setup"}
        </button>
      </form>
    </section>
  );
}
