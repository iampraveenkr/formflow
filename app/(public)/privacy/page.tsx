export default function PrivacyPage(): JSX.Element {
  return (
    <section className="w-full max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Privacy Policy (Placeholder)</h1>
      <p className="text-sm text-slate-600">This placeholder privacy policy is provided for pre-release testing and future Google Workspace Marketplace submission.</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        <li>FormFlow only accesses data required to execute configured workflows.</li>
        <li>OAuth tokens are encrypted or securely stored using server-side encryption utilities.</li>
        <li>Workspace data is isolated by workspace identifiers in every server query path.</li>
        <li>Audit and execution logs are retained for diagnostics and reliability.</li>
      </ul>
    </section>
  );
}
