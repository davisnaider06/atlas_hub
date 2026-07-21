import { prisma } from "@/lib/prisma";
import { ehEstagioGanho } from "./stage-utils";

/**
 * Regras de estágio que TOCAM O BANCO. Só pode ser importado de código de
 * servidor — a parte pura vive em `stage-utils.ts`, que o cliente pode usar.
 */

/** Descobre o tipo correto do contato a partir do estágio em que ele está. */
export async function tipoParaEstagio(stageId: string) {
  const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
  if (!stage) return "LEAD" as const;
  return ehEstagioGanho(stage.name) ? ("CLIENT" as const) : ("LEAD" as const);
}
