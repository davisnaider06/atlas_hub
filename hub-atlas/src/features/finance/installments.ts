/**
 * Lógica pura do financeiro — sem banco, pra ser testável.
 */

export type StatusEfetivo = "PAID" | "OVERDUE" | "PENDING";

/**
 * Divide um total em N parcelas de valor inteiro (centavos) que SOMAM
 * exatamente o total.
 *
 * R$ 100 em 3 não dá 33,33 × 3 (= 99,99): o centavo que sobra é distribuído nas
 * primeiras parcelas. Assim a soma nunca "perde" nem "cria" dinheiro.
 */
export function dividirValor(totalCents: number, n: number): number[] {
  if (n <= 0) throw new Error("Número de parcelas inválido");
  if (totalCents < 0) throw new Error("Valor inválido");

  const base = Math.floor(totalCents / n);
  const sobra = totalCents - base * n; // 0..n-1 centavos

  return Array.from({ length: n }, (_, i) => base + (i < sobra ? 1 : 0));
}

/**
 * Soma meses a uma data preservando o dia quando possível.
 *
 * 31/jan + 1 mês não existe em fevereiro; nesses casos usa o último dia do mês
 * alvo (28/fev), como fazem os sistemas de cobrança.
 */
export function adicionarMeses(data: Date, meses: number): Date {
  const d = new Date(data);
  const diaOriginal = d.getDate();
  d.setDate(1); // evita o "estouro" ao trocar de mês
  d.setMonth(d.getMonth() + meses);
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(diaOriginal, ultimoDia));
  return d;
}

/** N vencimentos mensais a partir do primeiro. */
export function gerarVencimentos(primeiro: Date, n: number): Date[] {
  return Array.from({ length: n }, (_, i) => adicionarMeses(primeiro, i));
}

/**
 * Status que a UI exibe. "Atrasado" não é guardado no banco: é PENDING cujo
 * vencimento já passou. Assim nenhum job precisa virar status todo dia.
 */
export function statusEfetivo(
  status: "PENDING" | "PAID",
  dueDate: Date,
  hoje: Date = new Date(),
): StatusEfetivo {
  if (status === "PAID") return "PAID";
  // compara só a data (ignora hora): vence "no fim do dia"
  const venc = new Date(dueDate);
  venc.setHours(23, 59, 59, 999);
  return venc.getTime() < hoje.getTime() ? "OVERDUE" : "PENDING";
}
