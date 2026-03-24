const milestones: ReadonlyArray<string> = [
  "Repository scaffold",
  "Auth and workspace setup",
  "Google account connection",
  "Database schema and migrations",
  "Form sync and field mapping",
  "Workflow CRUD",
  "Condition engine",
  "Action engine",
  "Workflow run logging and retries",
  "Dashboard pages",
  "Billing scaffold",
  "Tests and seed data",
  "Hardening and cleanup"
];

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">FormFlow</h1>
      <p className="mt-4 text-lg text-slate-700">
        Google Workspace-integrated workflow automation for Google Form submissions.
      </p>
      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-medium text-slate-900">Build milestones</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">
          {milestones.map((milestone) => (
            <li key={milestone}>{milestone}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
