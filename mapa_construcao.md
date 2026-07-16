# Plano de Desenvolvimento — Hub Atlas (Julho/2026)

Dev: Davi (solo) · Assistência: Claude no VSCode · Meta do mês: fundação sólida do Hub.

---

## 0. Visão do produto

O Hub Atlas **não é um CRM** — é uma plataforma que centraliza a operação da Atlas, e o CRM é só um dos módulos dela, junto com agendamentos e documentos. A ideia é ir agregando novos módulos ao Hub ao longo do tempo (financeiro, relatórios, gestão de equipe, etc. — ainda sem itens definidos). O MVP de julho cobre os três primeiros módulos; a arquitetura (feature-based, ver Fase 0) deve deixar fácil plugar novos módulos depois sem reestruturar o que já existe.

---

## 1. Stack fechada

- **Front:** Next.js (App Router) + TypeScript
- **Back:** Node, dentro do próprio Next (route handlers + server actions). Um repo, um deploy.
- **Banco:** Neon (Postgres serverless) + Prisma (ORM)
- **Storage de arquivos:** Google Cloud Storage (bucket)
- **Auth:** Clerk (decidido — ver seção 2)
- **Hospedagem:** Google Cloud Run com `min-instances=1` (mata cold start), sob o crédito de US$300/90 dias

### Por que Next full-stack e não back separado
Você é um dev sozinho. Manter dois projetos (front + API) dobra o trabalho de deploy, tipos e contexto sem ganho real nessa escala. O App Router te dá backend de verdade (route handlers, server actions) no mesmo repo. Se um dia precisar desacoplar, desacopla. Começar acoplado é a escolha certa pra velocidade agora.

---

## 2. Dois pontos de atenção técnicos (ler antes de codar)

### Cold start do banco (Neon)
Você foi radical contra cold start no app, e resolvemos isso com `min-instances=1` no Cloud Run. Mas o Neon no free tier tem *scale-to-zero* após ~5 min de inatividade, e acorda em algumas centenas de milissegundos. Isso NÃO é o cold start de 30-60s do serverless de app, é bem menor. Com o app sempre ligado e conexões vivas, o Neon fica quente na maior parte do tempo. Se mesmo esse sub-segundo incomodar quando tiver cliente, duas saídas: plano Neon Launch (~US$19/mês, desliga o autosuspend) ou rodar o Postgres numa VM. Por enquanto, aceita o sub-segundo e segue.

### Prisma + Neon: connection pooling
Prisma abre muitas conexões. Neon tem um limite baixo no free. Use as duas URLs:
- `DATABASE_URL` → endpoint **pooled** do Neon (o host com `-pooler`), usado pela aplicação.
- `DIRECT_URL` → endpoint **direto** (sem pooler), usado só pelas migrations.

**Atualização:** o projeto veio com **Prisma 7**, que mudou esse mecanismo — `url`/`directUrl` não são mais aceitos dentro do `datasource` no `schema.prisma` (dá erro de validação). O novo modelo:
- `prisma.config.ts` define a URL usada pelo Prisma Migrate/CLI → aponta pra `DIRECT_URL` (migrations precisam de locks de sessão que não funcionam de forma confiável via pgbouncer/transaction pooling).
- O `PrismaClient` da aplicação agora exige um **driver adapter** explícito. Usamos `@prisma/adapter-pg` (pacote `pg`) apontando pra `DATABASE_URL` (pooled), configurado em `src/lib/prisma.ts`.

```ts
// prisma.config.ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DIRECT_URL"] },
});
```

```ts
// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```

`schema.prisma` fica só com `provider = "postgresql"`, sem `url`/`directUrl`.

### Next.js 16: `middleware.ts` virou `proxy.ts`
O `create-next-app` puxou Next 16, que **deprecia** `middleware.ts` em favor de `proxy.ts` (exporta uma função `proxy` em vez de `middleware`). O `AGENTS.md` gerado no projeto avisa pra checar `node_modules/next/dist/docs/` antes de codar coisa nova, porque várias convenções mudaram. O arquivo do projeto é `src/proxy.ts`.

### Clerk: `createRouteMatcher` está deprecado — auth é "resource-based"
A versão instalada do Clerk (`@clerk/nextjs` 7.x) marca `createRouteMatcher` como deprecado: a recomendação atual é **não** centralizar proteção de rota por path-matching no middleware/proxy, e sim chamar `auth.protect()` dentro de cada layout/page/route handler que precisa de proteção (evita rota nova "vazar" por esquecimento de matcher). Foi assim que implementamos:
- `src/proxy.ts` só chama `clerkMiddleware()` — não faz path-matching de proteção.
- `src/app/(admin)/layout.tsx` e `src/app/(portal)/layout.tsx` chamam `auth.protect()` e depois checam o `role` do `User` no nosso Postgres (`ADMIN` vs `CLIENT`) — o role do Clerk (`publicMetadata.role`) não é usado diretamente pra isso porque não estamos usando Organizations do Clerk.
- Sincronização Clerk → nosso banco acontece via webhook (`src/app/api/webhooks/clerk/route.ts`, usa `verifyWebhook` de `@clerk/nextjs/webhooks`). Pra marcar alguém como admin, defina `publicMetadata.role = "admin"` no usuário pelo dashboard do Clerk — o webhook lê isso no `user.created`/`user.updated` e grava o role no nosso `User`.

**Passo manual pendente:** depois de criar sua conta e logar pela primeira vez, você precisa ir no dashboard do Clerk e setar `publicMetadata.role = "admin"` no seu próprio usuário — senão você entra como `CLIENT` por padrão.

---

## 3. Premissas (me corrige se alguma estiver errada)

- O Hub será usado por **duas audiências**: time interno da Atlas (admin) e clientes (acesso restrito ao que é deles). Por isso auth com roles desde a Fase 1.
- MVP de julho = **CRM funcional + auth + base de agendamento e documentos**. Não é o produto final, é a fundação que aguenta o primeiro cliente.
- Agendamento na v1 pode ser **Cal.com plugado** em vez de construído do zero (economiza dias).
- Documentos na v1 = **upload simples pra bucket GCS + metadados no banco**, sem versionamento nem preview avançado.

---

## 4. Roadmap por fase (13 → 31 de julho)

### Fase 0 — Setup e pipeline de deploy (dias 1-2)
- `create-next-app` com TypeScript e App Router.
- Instalar e configurar Prisma + Neon (pooled + direct URL).
- Definir estrutura de pastas (feature-based, não type-based).
- Escrever `Dockerfile` (Next em modo `standalone`).
- Subir um "hello world" no Cloud Run com `min-instances=1` **já no dia 1**. Validar o pipeline cedo evita a dor de descobrir problema de deploy na última semana.
- Decidir auth: Clerk (mais rápido de plugar, menos código) vs Auth.js (grátis, controle total). Recomendo Clerk pra ganhar dias, a não ser que você queira zero dependência externa.

### Fase 1 — Modelagem de dados e auth (dias 3-6)
- Schema Prisma: `User`, `Role`, `Lead`/`Client`, `PipelineStage`, `Appointment`, `Document`.
- Migrations rodando no Neon.
- Auth funcional com roles (admin Atlas / cliente) e proteção de rotas.

### Fase 2 — CRM núcleo (dias 7-12) · coração do Hub
- CRUD de contatos/leads. ✅ (`src/features/crm/actions.ts` + `contact-form.tsx`, rotas em `/dashboard/contacts`)
- Pipeline visual (kanban por status), drag-and-drop. ✅ (`/dashboard/pipeline`, `kanban-board.tsx` — HTML5 drag nativo, sem lib nova)
- Busca e filtros. ✅ (busca por nome/email/empresa em `/dashboard/contacts`, via `?q=`)
- É aqui que UX e fluidez precisam brilhar. Investe o capricho aqui. — versão atual é funcional/MVP (Tailwind puro, sem componente de design ainda); capricho visual fica pro polish da Fase 5.
- Seed de `PipelineStage` criado em `prisma/seed.ts` (`npx prisma db seed`) com 6 estágios-padrão (Novo Lead → Fechado). Ajustar nomes se não bater com o funil real da Atlas.
- Todas as Server Actions fazem `requireAdmin()` internamente (não dependem só da proteção do layout — Server Functions são alcançáveis por POST direto).

**Adiado (fora do escopo de hoje, 15/jul):** deploy "hello world" no Cloud Run (meta original da Fase 0, dia 1) — decisão consciente de priorizar o CRM núcleo primeiro.

### Fase 3 — Agendamentos (dias 13-15)
- Integrar Cal.com (embed ou API) ou modelo próprio de slots.
- Vincular cada agendamento a um contato do CRM.

### Fase 4 — Central de documentos (dias 16-18)
- Upload pra bucket GCS, metadados no Postgres, vínculo por cliente/card.

### Fase 5 — Polish, performance e deploy final (dias 19-22)
- Aplicar os designs do Pinterest (me manda eles quando chegar aqui).
- Loading states, evitar layout shift, queries indexadas.
- Testar com dados reais, deploy final estável.

---

## 5. Onde nasce a "fluidez" que você quer

Não vem da linguagem do back. Vem de:
1. **Front:** React Server Components pra mandar menos JS, `loading.tsx` em cada rota, skeletons no lugar de spinners, zero layout shift.
2. **Banco:** índices nas colunas de busca e filtro, `select` só do que precisa, evitar N+1 (Prisma `include` consciente).
3. **Deploy:** `min-instances=1` já resolve o cold start do app.

---

## 6. Primeiros comandos (Fase 0)

```bash
npx create-next-app@latest hub-atlas --typescript --app --eslint
cd hub-atlas
npm install prisma @prisma/client
npx prisma init
# configurar DATABASE_URL e DIRECT_URL no .env com as strings do Neon
npx prisma migrate dev --name init
```

No `next.config.js`, ativar `output: "standalone"` pra o Docker ficar leve.