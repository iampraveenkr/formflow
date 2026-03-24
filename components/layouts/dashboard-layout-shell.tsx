import { DashboardNav } from "@/components/navigation/dashboard-nav";

export function DashboardLayoutShell({ children }: { children?: unknown }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r border-slate-200 bg-white p-4">
        <div className="mb-6 px-3 py-2 text-lg font-semibold">FormFlow</div>
        <DashboardNav />
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
