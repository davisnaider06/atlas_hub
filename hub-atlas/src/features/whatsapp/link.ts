/**
 * Monta o link wa.me a partir de um telefone digitado à mão.
 *
 * O wa.me exige só dígitos, com DDI, sem "+" nem espaços. Números no CRM vêm
 * em mil formatos ("(11) 90000-0000", "+55 11...", "11900000000"), então
 * normalizamos e, quando não dá pra ter certeza, devolvemos null — melhor o
 * botão sumir do que abrir uma conversa com o número errado.
 */

const DDI_BRASIL = "55";

/** Devolve só os dígitos com DDI, ou null se o número for curto/ambíguo demais. */
export function normalizarTelefone(bruto: string | null | undefined): string | null {
  if (!bruto) return null;
  const digitos = bruto.replace(/\D/g, "");

  // já tem DDI do Brasil (55 + DDD + 8/9 dígitos = 12 ou 13)
  if (digitos.startsWith(DDI_BRASIL) && (digitos.length === 12 || digitos.length === 13)) {
    return digitos;
  }

  // nacional com DDD: 10 (fixo) ou 11 (celular com o 9) -> adiciona o DDI
  if (digitos.length === 10 || digitos.length === 11) {
    return DDI_BRASIL + digitos;
  }

  // 12-13 dígitos sem começar com 55: assume outro país já com DDI
  if (digitos.length === 12 || digitos.length === 13) {
    return digitos;
  }

  // curto demais pra ser um número válido
  return null;
}

/** URL do wa.me com mensagem opcional, ou null se o telefone não normaliza. */
export function linkWhatsApp(
  telefone: string | null | undefined,
  mensagem?: string,
): string | null {
  const numero = normalizarTelefone(telefone);
  if (!numero) return null;

  const base = `https://wa.me/${numero}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

/** Saudação padrão usando o primeiro nome do lead. */
export function saudacaoPadrao(nomeCompleto: string) {
  const primeiro = nomeCompleto.trim().split(/\s+/)[0] || "";
  return `Olá${primeiro ? `, ${primeiro}` : ""}! Aqui é da Atlas.`;
}
