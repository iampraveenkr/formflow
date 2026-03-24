import Link from "next/link";

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 px-6">
      <h1 className="text-4xl font-semibold">FormFlow</h1>
      <p className="text-slate-600">Google Workspace-integrated workflow automation scaffold.</p>
      <div className="flex gap-3">
        <Link className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/login">
          Go to login
        </Link>
        <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium" href="/dashboard">
          Open dashboard
        </Link>
      </div>
    </main>
  );
}
