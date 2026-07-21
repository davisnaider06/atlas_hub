/**
 * Dinheiro é guardado em CENTAVOS (inteiro). Float acumula erro de
 * arredondamento — R$ 0,1 + R$ 0,2 não dá exatamente R$ 0,3 em ponto flutuante.
 */

const formatador = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarCentavos(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return null;
  return formatador.format(cents / 100);
}

/** Faixa "R$ 1.000 – R$ 5.000", ou só um lado se o outro não foi preenchido. */
export function formatarFaixa(min: number | null, max: number | null) {
  const a = formatarCentavos(min);
  const b = formatarCentavos(max);
  if (a && b) return `${a} – ${b}`;
  if (a) return `a partir de ${a}`;
  if (b) return `até ${b}`;
  return "Sob consulta";
}

/**
 * Converte o que o usuário digitou ("1.500,50", "1500.50", "R$ 1500") em
 * centavos. Aceita as duas convenções porque as pessoas digitam das duas formas.
 */
export function paraCentavos(valor: FormDataEntryValue | null): number | null {
  const bruto = String(valor ?? "").trim();
  if (!bruto) return null;

  let limpo = bruto.replace(/[R$\s]/g, "");

  const temVirgula = limpo.includes(",");
  const temPonto = limpo.includes(".");

  if (temVirgula && temPonto) {
    // "1.500,50" -> ponto é separador de milhar
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    limpo = limpo.replace(",", ".");
  }

  const numero = Number(limpo);
  if (!Number.isFinite(numero) || numero < 0) return null;
  return Math.round(numero * 100);
}

/** Valor em centavos -> string pro input ("150050" -> "1500.50"). */
export function centavosParaInput(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}
