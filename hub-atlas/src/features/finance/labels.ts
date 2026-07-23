export const ROTULO_TIPO_CONTRATO: Record<string, string> = {
  ONE_OFF: "Projeto pontual",
  RECURRING: "Recorrente",
};

export const ROTULO_STATUS_CONTRATO: Record<string, string> = {
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

/** Status efetivo da parcela (o "atrasado" é derivado). */
export const ROTULO_STATUS_PARCELA: Record<string, string> = {
  PAID: "Pago",
  PENDING: "A receber",
  OVERDUE: "Atrasado",
};

export function tomStatusParcela(efetivo: string): "success" | "danger" | "neutral" {
  if (efetivo === "PAID") return "success";
  if (efetivo === "OVERDUE") return "danger";
  return "neutral";
}

export const ROTULO_CATEGORIA_DESPESA: Record<string, string> = {
  PAYROLL: "Pessoal",
  TOOLS: "Ferramentas",
  MARKETING: "Marketing",
  INFRA: "Infraestrutura",
  TAXES: "Impostos",
  OTHER: "Outro",
};
