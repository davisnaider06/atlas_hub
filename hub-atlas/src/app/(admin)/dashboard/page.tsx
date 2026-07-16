import Link from "next/link";
import { getPipelineBoard } from "@/features/crm/queries";

export default async function AdminDashboardPage() {
  const stages = await getPipelineBoard();
  const totalContacts = stages.reduce((sum, stage) => sum + stage.contacts.length, 0);

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Painel Atlas</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Contatos</p>
          <p className="text-2xl font-semibold">{totalContacts}</p>
        </div>
        {stages.map((stage) => (
          <div key={stage.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{stage.name}</p>
            <p className="text-2xl font-semibold">{stage.contacts.length}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link href="/dashboard/contacts" className="text-sm font-medium underline">
          Ver todos os contatos
        </Link>
        <Link href="/dashboard/pipeline" className="text-sm font-medium underline">
          Ver pipeline
        </Link>
      </div>
    </main>
  );
}
