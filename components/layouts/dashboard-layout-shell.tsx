import { DashboardNav } from "@/components/navigation/dashboard-nav";

export function DashboardLayoutShell({ children }: { children?: unknown }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r border-slate-200 bg-white p-4">
        <div className="mb-6 px-3 py-2 text-lg font-semibold">FormFlow</div>
        <DashboardNav />
        <form action="/api/auth/signout" method="post" className="mt-6 px-3">
          <button type="submit" className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            Sign out
          </button>
        </form>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
