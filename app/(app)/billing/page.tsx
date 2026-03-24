import { Card } from "@/components/ui/card";

export default function BillingPage(): JSX.Element {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="mt-1 text-sm text-slate-600">Track plan usage, invoices, and upgrade options.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-xs text-slate-500">Current plan</p><p className="mt-2 text-lg font-semibold">Starter</p></Card>
        <Card><p className="text-xs text-slate-500">Monthly runs</p><p className="mt-2 text-lg font-semibold">0 / 1,000</p></Card>
        <Card><p className="text-xs text-slate-500">Next invoice</p><p className="mt-2 text-lg font-semibold">—</p></Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Invoices</h2>
        <p className="mt-1 text-sm text-slate-600">No invoices yet. Upgrade and billing portal actions will be wired in a future pass.</p>
      </Card>
    </section>
  );
}
