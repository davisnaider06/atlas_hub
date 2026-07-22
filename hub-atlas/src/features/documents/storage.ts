import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

/**
 * Armazenamento de arquivos em disco, num volume do Docker.
 *
 * Os arquivos NÃO ficam em `public/`: qualquer coisa ali é servida sem
 * autenticação, e documento de cliente não pode ser aberto por quem tiver o
 * link. O download passa por uma rota que confere permissão.
 */

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

/** 20 MB: cobre proposta, contrato e apresentação sem virar depósito de vídeo. */
export const TAMANHO_MAXIMO = 20 * 1024 * 1024;

const TIPOS_PERMITIDOS = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
]);

export function tipoPermitido(mime: string) {
  return TIPOS_PERMITIDOS.has(mime);
}

/** Remove caminho e caracteres perigosos, preservando a extensão. */
export function nomeSeguro(nome: string) {
  const base = path.basename(nome).replace(/[^\w.\- ]+/g, "_");
  return base.slice(0, 120) || "arquivo";
}

/**
 * Grava o arquivo e devolve a chave de armazenamento.
 *
 * A chave usa UUID em vez do nome original: dois arquivos com o mesmo nome não
 * se sobrescrevem, e o nome enviado nunca vira caminho no disco.
 */
export async function salvarArquivo(file: File) {
  const ano = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, "0");
  const pasta = path.join(UPLOAD_DIR, `${ano}`, mes);
  await mkdir(pasta, { recursive: true });

  const ext = path.extname(nomeSeguro(file.name)).slice(0, 12);
  const chave = path.join(`${ano}`, mes, `${randomUUID()}${ext}`);

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, chave), bytes);

  // normaliza pra "/" — a chave vai pro banco e é usada em URL
  return chave.split(path.sep).join("/");
}

/**
 * Resolve a chave para um caminho absoluto, garantindo que ela não escapa do
 * diretório de uploads (defesa contra "../../etc/passwd" vindo do banco).
 */
function caminhoDe(chave: string) {
  const alvo = path.resolve(UPLOAD_DIR, chave);
  const raiz = path.resolve(UPLOAD_DIR);
  if (alvo !== raiz && !alvo.startsWith(raiz + path.sep)) {
    throw new Error("Caminho de arquivo inválido");
  }
  return alvo;
}

export async function lerArquivo(chave: string) {
  return readFile(caminhoDe(chave));
}

export async function apagarArquivo(chave: string) {
  await unlink(caminhoDe(chave)).catch(() => {
    // arquivo já sumiu do disco: o registro ainda deve ser removido do banco
  });
}
