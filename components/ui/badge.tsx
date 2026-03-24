export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" }): JSX.Element {
  const classes =
    tone === "success"
      ? "bg-green-100 text-green-700"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : tone === "danger"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-700";

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classes}`}>{label}</span>;
}
