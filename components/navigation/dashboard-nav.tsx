import Link from "next/link";

export const DASHBOARD_NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workflows", label: "Workflows" },
  { href: "/integrations", label: "Integrations" },
  { href: "/logs", label: "Logs" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" }
];

export function DashboardNav() {
  return (
    <nav className="flex flex-col gap-1">
      {DASHBOARD_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
