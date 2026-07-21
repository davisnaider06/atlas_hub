/**
 * Lógica pura de estágio — SEM acesso ao banco.
 *
 * Fica separada de `stage-rules.ts` de propósito: o formulário de contato é um
 * client component e precisa desta função. Se ela morasse ao lado de código que
 * importa o Prisma, o bundler arrastaria o driver `pg` (Node-only) pro
 * navegador e o build quebraria em "Can't resolve 'dns'".
 */

/**
 * Um contato vira CLIENT ao entrar no estágio de "Fechado - Ganho", e volta a
 * LEAD se sair dele (negócio reaberto).
 *
 * A detecção é por nome porque os estágios são dados (vêm do seed e podem ser
 * renomeados), não código. Casa "ganho" mas não "perdido".
 */
export function ehEstagioGanho(nome: string) {
  // NFD separa o acento da letra; o range remove os acentos soltos
  const normalizado = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return normalizado.includes("ganho") && !normalizado.includes("perdid");
}
