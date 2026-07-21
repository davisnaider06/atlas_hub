import type { Role } from "@/generated/prisma/enums";

/**
 * Capacidades do sistema. Telas e server actions perguntam por CAPACIDADE
 * ("pode gerenciar equipe?"), nunca por papel ("é OWNER?") — assim criar um
 * papel novo não exige caçar comparações espalhadas pelo código.
 */
export type Capability =
  | "team.manage" // convidar/remover pessoas e mudar papéis
  | "services.manage" // catálogo de serviços
  | "crm.manage" // criar/editar/excluir leads e clientes
  | "crm.view"
  | "appointments.manage"
  | "dashboard.view";

const MATRIZ: Record<Role, Capability[]> = {
  OWNER: [
    "team.manage",
    "services.manage",
    "crm.manage",
    "crm.view",
    "appointments.manage",
    "dashboard.view",
  ],
  ADMIN: [
    "services.manage",
    "crm.manage",
    "crm.view",
    "appointments.manage",
    "dashboard.view",
  ],
  MEMBER: ["crm.manage", "crm.view", "appointments.manage", "dashboard.view"],
  CLIENT: [],
};

export function can(role: Role | undefined | null, cap: Capability) {
  if (!role) return false;
  return MATRIZ[role]?.includes(cap) ?? false;
}

/** Quem tem acesso à área administrativa (qualquer coisa fora do portal). */
export function podeAcessarPainel(role: Role | undefined | null) {
  return can(role, "dashboard.view");
}

export const ROTULO_PAPEL: Record<Role, string> = {
  OWNER: "Sócio",
  ADMIN: "Administrador",
  MEMBER: "Colaborador",
  CLIENT: "Cliente",
};

export const DESCRICAO_PAPEL: Record<Role, string> = {
  OWNER: "Acesso total, incluindo gerenciar a equipe.",
  ADMIN: "Opera o CRM, agendamentos e o catálogo de serviços.",
  MEMBER: "Trabalha leads e agendamentos. Não acessa serviços nem equipe.",
  CLIENT: "Acesso apenas ao portal do cliente.",
};

/** Papéis que podem ser atribuídos na tela de Equipe. */
export const PAPEIS_ATRIBUIVEIS: Role[] = ["OWNER", "ADMIN", "MEMBER", "CLIENT"];
