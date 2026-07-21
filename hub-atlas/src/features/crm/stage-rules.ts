import { prisma } from "@/lib/prisma";

/**
 * Um contato vira CLIENT ao entrar no estágio de "Fechado - Ganho", e volta a
 * LEAD se sair dele (negócio reaberto).
 *
 * A detecção é por nome do estágio porque os estágios são dados (vêm do seed e
 * podem ser renomeados), não código. Casa "ganho" mas não "perdido".
 */
export function ehEstagioGanho(nome: string) {
  // NFD separa o acento da letra; o range remove os acentos soltos
  const normalizado = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return normalizado.includes("ganho") && !normalizado.includes("perdid");
}

/** Descobre o tipo correto do contato a partir do estágio em que ele está. */
export async function tipoParaEstagio(stageId: string) {
  const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
  if (!stage) return "LEAD" as const;
  return ehEstagioGanho(stage.name) ? ("CLIENT" as const) : ("LEAD" as const);
}
