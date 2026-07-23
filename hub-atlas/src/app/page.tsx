import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { buttonClasses } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  IconContacts,
  IconDocuments,
  IconPipeline,
  IconSchedule,
} from "@/components/ui/icons";

const recursos = [
  {
    icon: IconContacts,
    title: "CRM",
    description: "Centralize contatos, empresas e o histórico de cada conversa.",
  },
  {
    icon: IconPipeline,
    title: "Pipeline",
    description: "Acompanhe o funil num kanban e mova negócios entre estágios.",
  },
  {
    icon: IconSchedule,
    title: "Agendamentos",
    description: "Marque reuniões com clientes sem sair da plataforma.",
  },
  {
    icon: IconDocuments,
    title: "Documentos",
    description: "Compartilhe arquivos com segurança direto no portal do cliente.",
  },
];

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 items-center gap-3 px-5 pt-[env(safe-area-inset-top)] sm:px-7">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-fg">
            A
          </span>
          <span className="text-sm font-semibold tracking-tight">Hub Atlas</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {userId ? (
            <Link href="/dashboard" className={buttonClasses("primary")}>
              Ir para o painel
            </Link>
          ) : (
            <Link href="/sign-in" className={buttonClasses("secondary")}>
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-subtle px-3 py-1 text-xs font-medium text-brand">
          <span className="size-1.5 rounded-full bg-brand" />
          Plataforma interna da Atlas
        </span>

        <h1 className="mt-6 max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Toda a operação da Atlas em um só lugar
        </h1>

        <p className="mt-4 max-w-xl text-pretty text-base text-muted">
          CRM, pipeline de vendas, agendamentos e documentos — integrados, com portal
          próprio para seus clientes acompanharem tudo.
        </p>

        {!userId && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up" className={buttonClasses("primary", "px-6 py-2.5")}>
              Criar conta
            </Link>
            <Link href="/sign-in" className={buttonClasses("secondary", "px-6 py-2.5")}>
              Entrar
            </Link>
          </div>
        )}

        <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recursos.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.title} className="glass-panel rounded-2xl p-5 text-left">
                <span className="grid size-10 place-items-center rounded-xl bg-brand/15 text-brand">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-3.5 text-sm font-semibold tracking-tight">{r.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{r.description}</p>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="px-5 py-6 text-center text-xs text-subtle sm:px-7">
        Hub Atlas · uso interno
      </footer>
    </div>
  );
}
