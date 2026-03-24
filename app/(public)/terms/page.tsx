export default function TermsPage(): JSX.Element {
  return (
    <section className="w-full max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Terms of Service (Placeholder)</h1>
      <p className="text-sm text-slate-600">These placeholder terms outline expected use before production launch and Marketplace listing.</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        <li>Customers are responsible for workflow content and downstream service usage.</li>
        <li>Rate limits and plan limits apply as documented in billing settings.</li>
        <li>Availability goals and support SLA vary by plan tier.</li>
      </ul>
    </section>
  );
}
