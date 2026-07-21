import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Erros em que a conexão caiu ANTES da query rodar (TLS não estabelecido,
 * socket fechado, servidor encerrou). Nesses casos o comando não chegou a ser
 * executado, então repetir é seguro — não há risco de gravar duas vezes.
 *
 * Bancos serverless (Neon) suspendem por inatividade e derrubam conexões
 * ociosas; sem isso, a primeira navegação depois de um tempo parado quebra.
 */
const PADROES_TRANSITORIOS = [
  "socket disconnected before secure tls connection",
  "connection terminated",
  "server has closed the connection",
  "connection closed",
  "econnreset",
  "etimedout",
  "connect timeout",
  // pool não conseguiu abrir conexão a tempo — comum quando o banco serverless
  // ainda está subindo e várias queries chegam juntas
  "timeout exceeded when trying to connect",
];

function ehTransitorio(erro: unknown) {
  const msg = (erro instanceof Error ? erro.message : String(erro)).toLowerCase();
  return PADROES_TRANSITORIOS.some((p) => msg.includes(p));
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // mantém a conexão viva pra reduzir a chance de o servidor derrubá-la por ócio
  keepAlive: true,
  // se o banco está "acordando", vale esperar bem mais que o padrão
  connectionTimeoutMillis: 30_000,
  idleTimeoutMillis: 30_000,
  // poucas conexões: abrir muitas de uma vez num banco frio é o que estoura o
  // timeout. Uma página faz poucas queries e elas se revezam rápido.
  max: 3,
});

function criarCliente() {
  return new PrismaClient({ adapter }).$extends({
    query: {
      async $allOperations({ args, query }) {
        const TENTATIVAS = 3;
        let ultimoErro: unknown;

        for (let i = 0; i < TENTATIVAS; i++) {
          try {
            return await query(args);
          } catch (erro) {
            if (!ehTransitorio(erro)) throw erro;
            ultimoErro = erro;
            // espera crescente: dá tempo do banco serverless subir
            await new Promise((r) => setTimeout(r, 250 * (i + 1)));
          }
        }
        throw ultimoErro;
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
