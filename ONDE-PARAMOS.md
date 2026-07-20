# Onde paramos — Hub Atlas (handoff)

> Documento de continuidade. Atualizado em **2026-07-20**.
> **Segredos NÃO estão aqui** (repo é público) — ver seção [Segredos](#segredos).

---

## TL;DR

- ✅ **Deploy: concluído.** Hub no ar em https://atlas-ia.duckdns.org, VPS Oracle Always Free, **R$ 0/mês**.
- 🚧 **Fase atual: design & front.** Fundação de tema + sidebar retrátil + dashboard novo já feitos. Faltam as demais telas.

---

# PARTE 1 — Infraestrutura (concluída)

| Item | Valor |
|---|---|
| Provedor | Oracle Cloud (OCI) — Always Free |
| Região | Brazil East (São Paulo) `sa-saopaulo-1` (AD único) |
| Instância | `atlas-hub-2` — `VM.Standard.A1.Flex`, 2 OCPU / 12 GB (ARM) |
| SO | Ubuntu 24.04 (aarch64) |
| IP fixo (reservado) | `163.176.174.160` |
| Domínio | `atlas-ia.duckdns.org` (DuckDNS grátis) |
| Stack em produção | Docker Compose: Next.js + Postgres 16 local + Caddy (HTTPS) |

### A manha que resolveu o "Out of capacity"
O shape grátis **A1.Flex** vivia sem capacidade em SP. Solução: **criar no `A2.Flex`** (que tinha capacidade, mas é pago) e depois **trocar o shape pra `A1.Flex`** via resize — a VM migra pro host grátis. Se precisar recriar, use essa manha.

### Operar a VM
```bash
# conectar
ssh -i C:\Users\davi.snaider\.ssh\atlas-hub.key ubuntu@163.176.174.160

# app fica em /home/ubuntu/atlas_hub/hub-atlas
docker compose ps                 # status
docker compose logs -f app        # logs

# publicar mudanças (depois de dar push no GitHub)
cd ~/atlas_hub/hub-atlas && git pull && docker compose up -d --build
```

### Backup
Script `/home/ubuntu/backup-db.sh`, cron **diário às 3h**, dumps em `/home/ubuntu/backups/` (retém 14 dias).
**TODO:** copiar dumps pra fora da VPS de tempos em tempos.

---

# PARTE 2 — Design & Front (em andamento)

**Referências visuais:** `design-references/img1.jpg` e `img2.png` (ficam só na máquina local, não versionadas — são mockups de terceiros). São dois dashboards de cripto (CoinSphere / Nexbit): preto quente + laranja, sidebar retrátil, cards de vidro, gráficos com gradiente.

**Direção acordada:** replicar a **linguagem visual** (cores, componentes, sidebar, glass, estilo dos gráficos) aplicada ao **conteúdo do CRM** — não copiar o conteúdo de cripto.

### ✅ Já feito

**Fundação de tema** (`src/app/globals.css`)
- Sistema de tokens semânticos (`--bg`, `--surface`, `--brand`, `--text`...) com **light + dark**
- Paleta extraída das referências: preto quente (`#0a0705`) + laranja (`#ff6b2c`)
- **Glassmorphism iOS**: utilitários `glass` e `glass-panel` — translúcido + `blur` + `saturate(200%)` + realce especular no topo
- **Brilho ambiente** laranja difuso atrás da página (é o que dá o que "borrar" pro vidro funcionar)
- Corrigido bug: a fonte **Geist** era carregada e descartada por um `font-family: Arial` no CSS

**Temas e sidebar sem flash** (`src/app/layout.tsx`)
- Script inline aplica `data-theme` e `data-sidebar` no `<html>` **antes da primeira pintura**
- Variantes Tailwind 4 customizadas: `dark:` (por atributo) e `collapsed:`

**Shell** (`src/app/(admin)/_components/`)
- `sidebar.tsx` — retrátil (expandido com labels/seções ↔ rail de ícones), botão sempre visível que gira a seta, card de ajuda em vidro, itens "em breve" pra Agendamentos/Documentos
- `topbar.tsx` — busca, toggle de tema, notificações, avatar Clerk
- A antiga `admin-nav.tsx` foi **removida**

**Componentes** (`src/components/ui/`)
- `theme-toggle.tsx` — sem estado React (ícone via CSS), zero flicker
- `icons.tsx` — set de ícones SVG inline (sem dependência)
- `card.tsx` — `Card`, `CardHeading`, `DeltaChip`

**Dashboard** (`src/app/(admin)/dashboard/page.tsx` + `src/features/dashboard/`)
- Grade replicando a img2: 3 cards em cima, gráfico grande (2 col) + card de destaque embaixo
- `queries.ts` — métricas (série mensal de contatos, conversão, atividade recente, distribuição por estágio)
- `contacts-chart.tsx` — **Recharts 3.9.2**, área laranja com gradiente, grid tracejado, tooltip flutuante em vidro

### 🚧 O que falta fazer

**Telas ainda no visual antigo** (prioridade alta — são a maioria):
1. **Contatos** — lista (`dashboard/contacts/page.tsx`), novo (`contacts/new`), detalhe (`contacts/[id]`)
2. **Pipeline kanban** (`dashboard/pipeline/page.tsx` + `features/crm/kanban-board.tsx`)
3. **Portal do cliente** (`(portal)/portal/page.tsx`) — hoje praticamente vazio
4. **Landing** (`app/page.tsx`) — ainda o template básico
5. **Telas de login/cadastro** (`sign-in`, `sign-up`) — aparência padrão do Clerk

**Componentes que faltam na biblioteca:** Input, Select, Badge, Table, EmptyState, Dropdown, SegmentedControl (Day/Week/Month da referência), Modal.

**Gráficos adicionais:** sparklines nos cards, gráfico de funil.
> ⚠️ Se for usar **paleta categórica** (várias cores pros estágios), ela precisa ser **validada por script** (contraste + daltonismo), não escolhida no olho. Até agora evitei isso usando matiz único com intensidade proporcional.

**Limpeza:** remover SVGs do template Next em `public/` (`next.svg`, `vercel.svg`, etc.) e criar um favicon/logo da Atlas.

**Funcionalidades pendentes** (depois do design): Agendamentos, Documentos, Portal do cliente de verdade.

---

## Rodar localmente (loop de design)

```bash
cd hub-atlas
npm install     # se for outra máquina
npm run dev     # http://localhost:3000
```

- Node 24 / npm 11. Hot reload ligado.
- O `.env` local aponta pro **Neon** (banco antigo, ainda vivo, com dados de teste).
- ⚠️ **Neon free suspende por inatividade**: a primeira carga pode dar `PrismaClientKnownRequestError` / erro de TLS. **Recarregue uma vez** que ele acorda. Se atrapalhar muito, subir um Postgres local em Docker.
- Produção usa Postgres local na VPS — o Neon **não** é mais usado lá.

### Cuidados do projeto
- `hub-atlas/AGENTS.md`: esta versão do **Next 16 tem breaking changes** — consultar `node_modules/next/dist/docs/` antes de codar.
- Tailwind **4.3.2**: sintaxe nova (`@theme inline`, `@custom-variant`, `@utility`), bem diferente da v3.
- Ao criar utilitário condicional, cuidado: as variantes usam `:where()` (especificidade zero). `hidden` + `collapsed:block` **não funciona** — o `hidden` ganha. Foi um bug real já corrigido.

---

## Segredos

Nenhum valor secreto está neste arquivo (repo público). Eles vivem em:
- **VM:** `/home/ubuntu/atlas_hub/hub-atlas/.env` — senha do Postgres, chaves Clerk, webhook secret
- **Local:** `hub-atlas/.env` (não versionado) — chaves Clerk de teste + URL do Neon

```bash
# puxar os valores da VM se precisar
ssh -i C:\Users\davi.snaider\.ssh\atlas-hub.key ubuntu@163.176.174.160 "cat ~/atlas_hub/hub-atlas/.env"
```

---

## Para continuar de outra máquina

- **Código:** repo público `davisnaider06/atlas_hub` — só clonar e `npm install`.
- **Para publicar na VPS:** precisa da **chave SSH privada**, que está só no PC do trabalho em `C:\Users\davi.snaider\.ssh\atlas-hub.key`. Levar de forma segura — **nunca** subir pro GitHub.
- **Ferramentas OCI** (só pra mexer na infra): SDK em `C:\oci`, credenciais em `C:\Users\davi.snaider\.oci\`, scripts em `C:\Users\davi.snaider\atlas-vps\`.
- **Referências de design:** `design-references/` (local, não versionada).

## Pendências soltas
- Conferir no **OCI Billing → Cost Analysis** se os minutos no shape A2 geraram cobrança (provável: centavos ou zero).
- Se o IP mudar, atualizar no painel do **DuckDNS**.
