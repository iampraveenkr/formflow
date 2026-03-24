export function AuthLayoutShell({ children }: { children?: unknown }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">{children}</main>;
}
