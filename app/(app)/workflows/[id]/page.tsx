interface WorkflowDetailPageProps {
  params: {
    id: string;
  };
}

export default function WorkflowDetailPage({ params }: WorkflowDetailPageProps): JSX.Element {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Workflow: {params.id}</h1>
      <p className="mt-2 text-sm text-slate-600">Condition and action builder UI will be added in later milestones.</p>
    </section>
  );
}
