import { IconWhatsApp } from "@/components/ui/icons";
import { linkWhatsApp, saudacaoPadrao } from "./link";

/**
 * Botão que abre a conversa do WhatsApp com o lead já preenchida.
 *
 * É um simples link wa.me (sem conta conectada): abre o WhatsApp que a pessoa
 * já usa. Quando a SDR de IA entrar, o envio automático passa pela API oficial
 * — este botão continua sendo o atalho manual do vendedor.
 *
 * Some quando o telefone não dá pra normalizar, em vez de abrir número errado.
 */
export function WhatsAppButton({
  telefone,
  nome,
  variante = "cheio",
}: {
  telefone: string | null | undefined;
  nome: string;
  variante?: "cheio" | "icone";
}) {
  const url = linkWhatsApp(telefone, saudacaoPadrao(nome));
  if (!url) return null;

  if (variante === "icone") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title="Conversar no WhatsApp"
        aria-label="Conversar no WhatsApp"
        className="grid size-9 place-items-center rounded-md border border-border text-[#25D366] transition-colors hover:bg-surface-hover"
      >
        <IconWhatsApp className="size-4" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-[#0a2e17] transition-colors hover:bg-[#1fbb5a]"
    >
      <IconWhatsApp className="size-4" />
      WhatsApp
    </a>
  );
}
