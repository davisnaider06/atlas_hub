import { KanbanBoard } from "@/features/crm/kanban-board";
import { getPipelineBoard } from "@/features/crm/queries";

export default async function PipelinePage() {
  const stages = await getPipelineBoard();

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Pipeline</h1>
      <KanbanBoard stages={stages} />
    </main>
  );
}
