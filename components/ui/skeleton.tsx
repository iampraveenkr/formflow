export function Skeleton({ className = "" }: { className?: string }): JSX.Element {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}
