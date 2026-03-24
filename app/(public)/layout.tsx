import { AuthLayoutShell } from "@/components/layouts/auth-layout-shell";

export default function PublicLayout({ children }: { children: unknown }) {
  return <AuthLayoutShell children={children} />;
}
