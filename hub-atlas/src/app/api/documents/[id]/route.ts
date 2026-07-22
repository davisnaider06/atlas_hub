import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/features/auth/current-user";
import { can } from "@/features/auth/permissions";
import { prisma } from "@/lib/prisma";
import { lerArquivo } from "@/features/documents/storage";

/**
 * Baixa um documento.
 *
 * Os arquivos ficam fora de `public/` justamente para passar por aqui: sem esta
 * checagem, qualquer pessoa com o link abriria contrato de cliente.
 *
 * Regras:
 * - quem opera o CRM vê tudo;
 * - cliente só vê documento vinculado ao próprio cadastro.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new Response("Não autenticado", { status: 401 });

  const user = await getCurrentUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return new Response("Não encontrado", { status: 404 });

  const operaCrm = can(user.role, "crm.view");
  const ehDonoDoDocumento =
    doc.scope === "CONTACT" && doc.contactId !== null && doc.contactId === user.contactId;

  if (!operaCrm && !ehDonoDoDocumento) {
    // 404 em vez de 403: não confirma sequer que o documento existe
    return new Response("Não encontrado", { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await lerArquivo(doc.storageKey);
  } catch {
    return new Response("Arquivo indisponível", { status: 410 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      // inline deixa o navegador exibir PDF/imagem em vez de só baixar
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      "Content-Length": String(bytes.length),
      // documento pode ser sensível: nunca em cache compartilhado
      "Cache-Control": "private, no-store",
    },
  });
}
