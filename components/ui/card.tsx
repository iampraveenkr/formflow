import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }): JSX.Element {
  return <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}
