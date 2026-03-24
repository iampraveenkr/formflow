import { DashboardLayoutShell } from "@/components/layouts/dashboard-layout-shell";

export default function AppLayout({ children }: { children: unknown }) {
  return <DashboardLayoutShell children={children} />;
}
