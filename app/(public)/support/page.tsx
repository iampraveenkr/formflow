export default function SupportPage(): JSX.Element {
  return (
    <section className="w-full max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Support</h1>
      <p className="text-sm text-slate-600">Need help with setup, OAuth, or workflow reliability?</p>
      <div className="space-y-2 text-sm text-slate-700">
        <p><strong>Email:</strong> support@formflow.local</p>
        <p><strong>Response goals:</strong> Free (best effort), Starter (1 business day), Pro (4 business hours)</p>
        <p><strong>Status:</strong> Check <a className="text-blue-600" href="/api/health">/api/health</a> for service health.</p>
      </div>
    </section>
  );
}
