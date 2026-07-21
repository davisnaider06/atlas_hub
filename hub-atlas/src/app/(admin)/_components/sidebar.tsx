"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Capability } from "@/features/auth/permissions";
import {
  IconChevronLeft,
  IconClients,
  IconContacts,
  IconDocuments,
  IconGrid,
  IconHelp,
  IconPipeline,
  IconRoutine,
  IconSchedule,
  IconServices,
  IconSettings,
  IconTeam,
} from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: string;
  icon: typeof IconGrid;
  soon?: boolean;
  /** se definida, o item só aparece pra quem tem a capacidade */
  cap?: Capability;
};

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Comercial",
    items: [
      { href: "/dashboard", label: "Painel", icon: IconGrid },
      { href: "/dashboard/routine", label: "Rotina", icon: IconRoutine },
      { href: "/dashboard/leads", label: "Leads", icon: IconContacts },
      { href: "/dashboard/clients", label: "Clientes", icon: IconClients },
      { href: "/dashboard/pipeline", label: "Pipeline", icon: IconPipeline },
      { href: "/dashboard/appointments", label: "Agendamentos", icon: IconSchedule },
    ],
  },
  {
    title: "Catálogo",
    items: [
      {
        href: "/dashboard/services",
        label: "Serviços",
        icon: IconServices,
        cap: "services.manage",
      },
    ],
  },
  {
    title: "Em breve",
    items: [{ href: "#", label: "Documentos", icon: IconDocuments, soon: true }],
  },
  {
    title: "Conta",
    items: [
      {
        href: "/dashboard/team",
        label: "Equipe",
        icon: IconTeam,
        cap: "team.manage",
      },
      { href: "/dashboard/settings", label: "Configurações", icon: IconSettings },
    ],
  },
];

function toggleSidebar() {
  const el = document.documentElement;
  const collapsed = el.getAttribute("data-sidebar") === "collapsed";
  if (collapsed) el.removeAttribute("data-sidebar");
  else el.setAttribute("data-sidebar", "collapsed");
  try {
    localStorage.setItem("sidebar", collapsed ? "expanded" : "collapsed");
  } catch {
    // localStorage bloqueado: preferência vale só nesta sessão.
  }
}

export function Sidebar({ caps }: { caps: Capability[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface/70 backdrop-blur-xl transition-[width] duration-200 collapsed:w-16"
    >
      {/* marca + botão de retrair (o botão fica SEMPRE visível: quando retraído
          a marca some e ele assume o lugar, senão não teria como reabrir) */}
      <div className="flex h-16 items-center gap-2.5 px-4 collapsed:justify-center collapsed:px-0">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5 collapsed:hidden"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-brand-fg">
            <span className="text-sm font-bold">A</span>
          </span>
          <span className="truncate text-sm font-semibold tracking-tight">
            Hub Atlas
          </span>
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Retrair ou expandir menu"
          title="Retrair ou expandir menu"
          className="ml-auto grid size-8 shrink-0 place-items-center rounded-md text-subtle transition-colors hover:bg-surface-hover hover:text-text collapsed:ml-0"
        >
          <IconChevronLeft className="size-4 transition-transform duration-200 collapsed:rotate-180" />
        </button>
      </div>

      {/* navegação */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {sections
          .map((section) => ({
            ...section,
            items: section.items.filter((i) => !i.cap || caps.includes(i.cap)),
          }))
          .filter((section) => section.items.length > 0)
          .map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-2 text-[0.65rem] font-medium uppercase tracking-wider text-subtle collapsed:hidden">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = !item.soon && isActive(item.href);

                if (item.soon) {
                  return (
                    <li key={item.label}>
                      <span
                        title={`${item.label} — em breve`}
                        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-subtle opacity-60 collapsed:justify-center"
                      >
                        <Icon className="size-[18px] shrink-0" />
                        <span className="truncate collapsed:hidden">{item.label}</span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={item.label}
                      className={
                        active
                          ? "flex items-center gap-3 rounded-lg border border-brand-border bg-brand-subtle px-2.5 py-2 text-sm font-medium text-brand collapsed:justify-center"
                          : "flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-text collapsed:justify-center"
                      }
                    >
                      <Icon className="size-[18px] shrink-0" />
                      <span className="truncate collapsed:hidden">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* card de ajuda (some quando retraído) */}
      <div className="p-3 collapsed:hidden">
        <div className="glass-panel rounded-xl p-4 text-center">
          <span className="mx-auto grid size-9 place-items-center rounded-full bg-brand/15 text-brand">
            <IconHelp className="size-[18px]" />
          </span>
          <p className="mt-2.5 text-sm font-medium">Precisa de ajuda?</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Fale com o time da Atlas se algo travar.
          </p>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
          >
            Falar com suporte
          </button>
        </div>
      </div>

    </aside>
  );
}
