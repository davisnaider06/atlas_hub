/** Rótulos das categorias — usados no formulário, nos filtros e nas listas. */
export const ROTULO_CATEGORIA: Record<string, string> = {
  SCRIPT: "Script",
  PLANNING: "Planejamento",
  SCOPE: "Escopo de serviço",
  CONTRACT: "Contrato",
  PROPOSAL: "Proposta",
  OTHER: "Outro",
};

/** Tamanho legível: 1536 -> "1,5 KB". */
export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}
