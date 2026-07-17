# Onde paramos — Hub Atlas (handoff)

> Documento de continuidade. Atualizado em **2026-07-17**.
> Objetivo: conseguir retomar o trabalho de qualquer máquina.
> **Segredos NÃO estão aqui** (repo é público) — ver seção [Segredos](#segredos).

---

## TL;DR

O Hub Atlas está **no ar, em produção, de graça**:

- 🌐 **URL:** https://atlas-ia.duckdns.org (HTTPS válido)
- ☁️ **Onde roda:** VPS Oracle Cloud **Always Free** (ARM), custo **R$ 0/mês**
- 🐳 **Como roda:** Docker Compose (Next.js + Postgres local + Caddy), **zero cold start**
- 🔐 **Login:** Clerk funcionando; usuário admin criado
- 💾 **Backup:** automático, diário, já configurado

O deploy está **100% completo e funcional**. A próxima fase é **design + funcionalidades** (o app hoje tem só o CRM e um visual cru).

---

## Infraestrutura

| Item | Valor |
|---|---|
| Provedor | Oracle Cloud Infrastructure (OCI) — conta Always Free |
| Região | Brazil East (São Paulo) `sa-saopaulo-1` (AD único) |
| Instância | `atlas-hub-2` |
| Shape | `VM.Standard.A1.Flex` — 2 OCPU / 12 GB (ARM, Always Free) |
| SO | Ubuntu 24.04 (aarch64) |
| IP público (fixo/reservado) | `163.176.174.160` |
| Domínio | `atlas-ia.duckdns.org` (DuckDNS grátis → aponta pro IP acima) |
| Usuário SSH | `ubuntu` |

### A pegadinha que resolvemos (importante lembrar)
O shape grátis **A1.Flex** vivia dando **"Out of host capacity"** em São Paulo. Solução que funcionou: **criar a VM no shape `A2.Flex` (que tinha capacidade) e depois trocar o shape pra `A1.Flex`** (resize) — a VM migra pro host A1 grátis. Se algum dia precisar recriar, use essa manha.

---

## Como acessar e operar a VM

### Conectar por SSH
```
ssh -i C:\Users\davi.snaider\.ssh\atlas-hub.key ubuntu@163.176.174.160
```

### Onde está o app na VM
```
/home/ubuntu/atlas_hub/hub-atlas
```

### Comandos do dia a dia (rodar dentro dessa pasta na VM)
```bash
docker compose ps                 # status dos containers
docker compose logs -f app        # logs do app
docker compose restart app        # reiniciar o app
```

### Fazer um deploy novo (depois de mexer no código e dar push)
```bash
cd ~/atlas_hub/hub-atlas
git pull
docker compose up -d --build      # rebuild + migrations + restart
```

### Backup do banco
- Script: `/home/ubuntu/backup-db.sh` (roda `pg_dump`, guarda 14 dias)
- Agendado no cron: **todo dia às 3h**
- Dumps em: `/home/ubuntu/backups/`
- Rodar manualmente: `~/backup-db.sh`
- **TODO:** copiar dumps pra fora da VPS de vez em quando (senão morre junto se a VM morrer).

---

## Estado do aplicativo

**Stack:** Next.js 16, React 19, Tailwind 4, Prisma 7, Clerk 7. (⚠️ versões bleeding-edge — ver `hub-atlas/AGENTS.md`: ler os docs em `node_modules/next/dist/docs/` antes de codar.)

### ✅ Já construído
- **CRM:** contatos (lista / novo / detalhe), pipeline kanban, dashboard com cards de contagem
- **Auth:** Clerk completo, webhook sincronizando usuário → banco, papéis ADMIN/CLIENT
- **Separação de áreas:** `(admin)/dashboard` e `(portal)/portal`

### 🟡 Modelado no banco, mas SEM tela ainda
- **Agendamentos** (`Appointment`) — era o próximo do roadmap
- **Documentos** (`Document`) — upload de arquivo por contato
- **Portal do cliente** (`/portal`) — rota existe mas está vazia

### 🔴 Design
Praticamente o template padrão do Next (fonte Arial, tema escuro básico, sem design system nem identidade visual). É o maior salto de percepção a ganhar.

---

## Próximos passos (roadmap sugerido)

1. **Fundação de design** — design system (cores, tipografia Geist, componentes) + repaginar as telas do CRM. Tudo depois já nasce bonito.
2. **Agendamentos** — construir o módulo (arquitetura decidida: OAuth Google Calendar por usuário, evento na agenda do atendente + convite ao cliente).
3. **Portal do cliente** — transformar o `/portal` vazio numa experiência real (status, agendamentos, documentos).
4. **Documentos** — upload por contato (obs: schema usa storage tipo GCS; como agora é VPS, reavaliar pra volume local ou S3-compatível).

---

## Para continuar de casa

O que você precisa ter na outra máquina:

- **Código:** já está no GitHub (repo público `davisnaider06/atlas_hub`) — é só `git clone`.
- **Para acessar a VM (deploys, logs):** você precisa da **chave SSH privada**, que hoje está **só neste PC** em `C:\Users\davi.snaider\.ssh\atlas-hub.key`. Leve-a de forma segura (gerenciador de senhas / pendrive) — **não** suba ela pro GitHub.
- **Ferramentas OCI (só se for mexer na infra):** o SDK Python fica em `C:\oci` e a config/API key em `C:\Users\davi.snaider\.oci\` — também só neste PC.
- **Scripts auxiliares da VPS** (describe, resize, reservar IP, retry de criação): `C:\Users\davi.snaider\atlas-vps\` — só neste PC.

Para **trabalhar em design/funcionalidades** de casa, na prática você só precisa do repo (clonar, rodar local, dar push). Para **publicar** as mudanças na VPS, aí sim precisa da chave SSH.

---

## Segredos

Por segurança (repo público), **nenhum valor secreto está neste arquivo**. Eles vivem em:

- **`.env` da VM:** `/home/ubuntu/atlas_hub/hub-atlas/.env` — contém `POSTGRES_PASSWORD`, `DATABASE_URL`, chaves do Clerk e `CLERK_WEBHOOK_SIGNING_SECRET`.
- **`.env` local:** `hub-atlas/.env` (não versionado) — chaves do Clerk de teste.
- A senha do Postgres também está anotada na memória local do Claude (fora do repo).

Se precisar dos valores, puxe do `.env` da VM:
```
ssh -i C:\Users\davi.snaider\.ssh\atlas-hub.key ubuntu@163.176.174.160 "cat ~/atlas_hub/hub-atlas/.env"
```

---

## Pendências/observações

- Conferir no **OCI Billing → Cost Analysis** se os poucos minutos no shape A2 (pago) geraram alguma cobrança (provável: zero ou centavos).
- Se o IP `163.176.174.160` mudar algum dia, atualizar no painel do **DuckDNS**.
