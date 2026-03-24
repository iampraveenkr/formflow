"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage(): JSX.Element {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const errorCode = searchParams.get("error");

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Sign in to FormFlow</h1>
      <p className="mt-2 text-sm text-slate-600">Use your Google account to continue.</p>

      {errorCode ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Authentication failed ({errorCode}). Please try again.</p>
      ) : null}

      <a
        href="/api/auth/google/start"
        onClick={() => setIsLoading(true)}
        className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {isLoading ? "Redirecting to Google..." : "Continue with Google"}
      </a>
    </section>
  );
}
