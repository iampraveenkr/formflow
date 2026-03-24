export function Banner({ message, tone = "info" }: { message: string; tone?: "info" | "success" | "error" }): JSX.Element {
  const styles = tone === "success" ? "bg-green-50 text-green-700" : tone === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";
  return <p className={`rounded-md px-3 py-2 text-sm ${styles}`}>{message}</p>;
}
