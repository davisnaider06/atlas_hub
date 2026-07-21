/**
 * Lógica pura da grade do calendário, separada do componente pra poder ser
 * testada sem renderizar nada.
 */

/**
 * Chave YYYY-MM-DD em horário LOCAL.
 *
 * Não usar `toISOString()` aqui: ele converte pra UTC, e um evento às 21h no
 * Brasil (UTC-3) viraria o dia seguinte, aparecendo na célula errada.
 */
export function chaveDoDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function mesmoDia(a: Date, b: Date) {
  return chaveDoDia(a) === chaveDoDia(b);
}

/**
 * As 42 células (6 semanas) da grade do mês, começando no domingo anterior ao
 * dia 1 — mesma convenção do Google Calendar em pt-BR. Inclui dias dos meses
 * vizinhos pra fechar o quadro.
 */
export function gerarGrade(ano: number, mes: number) {
  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(primeiro);
  inicio.setDate(inicio.getDate() - primeiro.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
}

/** Agrupa agendamentos por dia local, pra a célula não precisar filtrar a lista. */
export function agruparPorDia<T extends { startsAt: Date | string }>(itens: T[]) {
  const mapa = new Map<string, T[]>();
  for (const item of itens) {
    const chave = chaveDoDia(new Date(item.startsAt));
    const lista = mapa.get(chave);
    if (lista) lista.push(item);
    else mapa.set(chave, [item]);
  }
  return mapa;
}
