# Onde paramos — Hub Atlas (handoff)

> Documento de continuidade. Atualizado em **2026-07-23**.
> Objetivo: retomar o trabalho de qualquer máquina.
> **Segredos NÃO estão aqui** (repo é público) — ver [Segredos](#segredos).

---

## TL;DR

O **Hub Atlas** está em produção, funcionando e em uso:

- 🌐 **https://atlas-ia.duckdns.org** — HTTPS válido, instalável como app (PWA)
- ☁️ VPS Oracle **Always Free** (ARM) — **R$ 0/mês**
- 🐳 Docker Compose: Next.js + Postgres local + Caddy — **zero cold start**
- ✅ CRM completo: leads, clientes, pipeline, agendamentos (com Google Calendar
  nos dois sentidos), rotina, serviços, documentos, equipe com permissões,
  botão de WhatsApp

O que falta é **evolução**, não fundação — ver [O que falta](#o-que-falta).

---

# PARTE 1 — Infraestrutura

| Item | Valor |
|---|---|
| Provedor | Oracle Cloud (OCI) — Always Free |
| Região | Brazil East (São Paulo) `sa-saopaulo-1` (AD único) |
| Instância | `atlas-hub-2` — `VM.Standard.A1.Flex`, 2 OCPU / 12 GB (ARM) |
| SO | Ubuntu 24.04 (aarch64) |
| IP fixo | `163.176.174.160` |
| Domínio | `atlas-ia.duckdns.org` (DuckDNS grátis) |
| Stack em prod | Docker Compose: app (Next standalone) + db (Postgres 16) + caddy |

### A manha que criou a VM (se precisar recriar)
O shape grátis A1.Flex vivia "out of capacity" em SP. Solução: criar no
**A2.Flex** (tem capacidade, mas é pago) e **trocar o shape para A1.Flex** via
resize — a VM migra pro host grátis.

### Operar a VM
```bash
# conectar (a chave está SÓ no PC do trabalho — ver "continuar de outra máquina")
ssh -i C:\Users\davi.snaider\.ssh\atlas-hub.key ubuntu@163.176.174.160

# app em /home/ubuntu/atlas_hub/hub-atlas
docker compose ps
docker compose logs -f app

# publicar mudanças (depois do git push)
cd ~/atlas_hub/hub-atlas && git pull && docker compose up -d --build
```
> ⚠️ O SSH pra essa VM cai com frequência ("Connection reset"). Tentar de novo
> quase sempre resolve; use `-o ServerAliveInterval=10 -o ConnectTimeout=40`.

### Backup
Script `/home/ubuntu/backup-db.sh`, cron **diário às 3h**, retém 14 dias em
`/home/ubuntu/backups/`. **Salva banco E documentos** (os arquivos ficam num
volume, fora do dump). TODO: mandar cópias pra fora da VPS.

### Volumes Docker
`pgdata` (banco), `uploads` (documentos), `caddy_data`/`caddy_config`.
O diretório `/app/uploads` nasce como `nextjs:nodejs` (senão upload dá
"permission denied" — o app não roda como root).

---

# PARTE 2 — Aplicação

**Stack:** Next.js 16, React 19, Tailwind 4, Prisma 7, Clerk 7.
⚠️ Versões bleeding-edge — ver `hub-atlas/AGENTS.md`: consultar
`node_modules/next/dist/docs/` antes de codar.

### Módulos prontos
- **Leads / Clientes** — um contato vira CLIENT automático ao entrar no estágio
  "Fechado - Ganho" (regra no formulário E no kanban). Cliente registra serviço
  contratado + valor.
- **Pipeline** — kanban com drag-and-drop.
- **Serviços** — catálogo com piso/teto de preço. Dinheiro em CENTAVOS (Int).
- **Agendamentos** — CRUD + visão de calendário mensal com modal. Sincroniza nos
  DOIS sentidos com a agenda **"ATLAS - AGENDAMENTOS"** do Google (OAuth por
  usuário). Só agendas graváveis; falha de push fica visível com botão de
  reenvio.
- **Rotina** — tarefas + sugestões derivadas (leads parados, agenda do dia).
  Modal ao logar 1x/dia. Sócio/admin atribui tarefa a membros da equipe.
- **Documentos** — dois usos: biblioteca interna da Atlas (scripts,
  planejamentos, escopos) e arquivos por lead/cliente. Arquivos FORA de
  `public/`, download com checagem de permissão.
- **Equipe + RBAC** — papéis OWNER/ADMIN/MEMBER/CLIENT, autorização por
  CAPACIDADE (não por papel). Pré-cadastro: cadastra a pessoa antes do 1º login;
  o webhook casa por email.
- **Portal do cliente** — status, agendamentos e documentos do próprio cliente.
- **WhatsApp** — botão wa.me (abre conversa com número + saudação) no lead e na
  lista. Ver `ONDE-PARAMOS` na memória do Claude: a SDR de IA futura usará a API
  oficial da Meta.
- **PWA** — instalável; service worker conservador (NÃO cacheia dados de CRM).

### Papéis e o que cada um faz
- **OWNER (Sócio)** — tudo, incluindo Equipe. É o papel do
  `davisnaider06@gmail.com`.
- **ADMIN** — CRM, agendamentos, serviços, documentos. Não mexe na Equipe.
- **MEMBER (Colaborador)** — leads, agendamentos, rotina. Sem serviços/equipe.
- **CLIENT** — só o portal.

### Migrations (8, todas aplicadas em prod)
`init` · `appointment_attendant_and_google_fields` · `google_account` ·
`two_way_sync` · `leads_clientes_servicos` · `rbac_equipe` · `rotina_tarefas` ·
`documentos`.

---

## O que falta

- **Reescrever `ONDE-PARAMOS.md`** sempre que evoluir (este arquivo).
- **SDR de IA + WhatsApp API oficial** — a construir; hoje só o botão wa.me
  manual existe. Exige conta Business, número dedicado, custo.
- **Enriquecer portal / métricas do painel** — ideias já levantadas, não
  priorizadas.
- **Configurar o Alves com permissão de escrita** na agenda do Google, se for
  sincronizar (hoje ele só tem leitura).

---

## Rodar localmente

```bash
cd hub-atlas
npm install     # se for outra máquina
npm run dev     # http://localhost:3000
```
- Node 24. O `.env` local aponta pro **Neon** (banco de dev, us-east-1).
- ⚠️ Neon suspende por inatividade: a 1ª carga pode dar erro de TLS/Prisma. O
  `lib/prisma.ts` já tem retry pra falha de conexão, mas se persistir,
  recarregue. Produção usa Postgres local, sem esse problema.

### Lições que evitam retrabalho (aprendidas na marra)
- **Sempre rodar `next build` ao mexer em client component.** O typecheck NÃO
  pega erro de bundling (ex: um client component puxou `pg` → "Can't resolve
  'dns'"). Regra: lógica pura em arquivo separado do que importa o Prisma.
- **Prisma Migrate não funciona contra o Neon** (shadow DB → erro P1017). O
  fluxo é: gerar SQL com `prisma migrate diff --from-config-datasource`, aplicar
  com `db execute`, registrar com `migrate resolve`. **Abortar se o SQL vier
  vazio** (falha de conexão gera migration fantasma). Em prod o `migrate deploy`
  funciona normal.
- **RBAC: nunca comparar papel fixo** (`role === "ADMIN"`). Usar
  `can(role, capacidade)`. Vários bugs vieram de comparações antigas que
  sobraram quando o sócio virou OWNER (rotas do Google, atendentes, webhook
  reescrevendo papel).
- **Tailwind 4** usa `:where()` nas variantes (especificidade 0): `hidden` +
  `collapsed:block` não funciona.
- **Fuso**: o container define `TZ=America/Sao_Paulo`. O Node usa ICU (horário
  certo mesmo sem tzdata no SO).

---

## Segredos

Nenhum valor secreto aqui (repo público). Eles vivem em:
- **VM:** `/home/ubuntu/atlas_hub/hub-atlas/.env` — Postgres, Clerk, Google
  (`GOOGLE_CLIENT_ID/SECRET`, `APP_URL`).
- **Local:** `hub-atlas/.env` (não versionado) — Clerk de teste + URL do Neon.

```bash
# puxar os valores da VM se precisar
ssh -i C:\Users\davi.snaider\.ssh\atlas-hub.key ubuntu@163.176.174.160 \
  "cat ~/atlas_hub/hub-atlas/.env"
```

### Integrações externas
- **Clerk** — auth. Webhook em `/api/webhooks/clerk` (define papel só na
  criação; a Equipe é a fonte de verdade depois).
- **Google Cloud** — projeto "Hub Atlas", OAuth **publicado** (sem expiração de
  7 dias), escopo `.../auth/calendar`. Redirect:
  `https://atlas-ia.duckdns.org/api/google/callback`.

---

## Para continuar de outra máquina

- **Código:** repo público `davisnaider06/atlas_hub` — `git clone` + `npm install`.
- **Publicar na VPS:** precisa da **chave SSH** (`C:\Users\davi.snaider\.ssh\atlas-hub.key`),
  que está **só no PC do trabalho**. Levar de forma segura — nunca subir pro GitHub.
- **Ferramentas OCI** (só pra infra): SDK em `C:\oci`, credenciais em
  `C:\Users\davi.snaider\.oci\`, scripts em `C:\Users\davi.snaider\atlas-vps\`.

## Pendências soltas
- Conferir no **OCI Billing** se os minutos no shape A2 geraram cobrança
  (provável: centavos).
- Se o IP mudar, atualizar no painel do **DuckDNS**.
