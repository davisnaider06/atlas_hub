import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { IconPlus } from "@/components/ui/icons";
import { KanbanBoard } from "@/features/crm/kanban-board";
import { getPipelineBoard } from "@/features/crm/queries";

export default async function PipelinePage() {
  const stages = await getPipelineBoard();
  const total = stages.reduce((soma, s) => soma + s.contacts.length, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-sm text-muted">
            {total} {total === 1 ? "contato" : "contatos"} no funil · arraste os cards
            entre os estágios
          </p>
        </div>
        <Link href="/dashboard/leads/new" className={buttonClasses("primary")}>
          <IconPlus className="size-4" />
          Novo contato
        </Link>
      </div>

      <KanbanBoard stages={stages} />
    </div>
  );
}
