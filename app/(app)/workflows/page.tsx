import Link from "next/link";

export default function WorkflowsPage(): JSX.Element {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Workflows</h1>
      <p className="mt-2 text-sm text-slate-600">Create and manage Google Form automation workflows.</p>
      <Link href="/workflows/demo" className="mt-4 inline-block text-sm font-medium text-blue-700 underline">
        Open sample workflow detail
      </Link>
    </section>
  );
}
