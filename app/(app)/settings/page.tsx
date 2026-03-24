import { Card } from "@/components/ui/card";

export default function SettingsPage(): JSX.Element {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage workspace preferences and operational defaults.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Workspace profile</h2>
          <p className="mt-1 text-sm text-slate-600">Name, timezone, and business details.</p>
          <p className="mt-3 text-sm text-slate-500">Editable controls will be connected in the next iteration.</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Execution defaults</h2>
          <p className="mt-1 text-sm text-slate-600">Retry behavior, notification preferences, and run retention.</p>
          <p className="mt-3 text-sm text-slate-500">Policy controls will appear here.</p>
        </Card>
      </div>
    </section>
  );
}
