# Deploy do Hub Atlas num VPS (zero cold start)

Runbook pra rodar o Hub Atlas numa máquina sempre-ligada. Sem Cloud Run, sem Neon,
sem cold start — nem do app nem do banco. Custo: **grátis** (Oracle) ou **~€4/mês** (Hetzner).

O que sobe na máquina (via `docker compose`):

- **app** — Next.js em modo standalone (o mesmo Dockerfile do Cloud Run)
- **db** — Postgres 16 local, com volume persistente
- **caddy** — proxy reverso com HTTPS automático (Let's Encrypt)
- **migrator** — roda `prisma migrate deploy` e encerra, antes do app subir

---

## 0. Escolher o VPS

| Provedor | Custo | Prós | Contras |
|---|---|---|---|
| **Hetzner** CX22 | ~€4/mês | Simples, rápido, confiável (x86) | Pago (mas baratíssimo) |
| **Oracle Cloud** Always Free | **€0 pra sempre** | Grátis de verdade, ARM 24GB RAM | Console chato, às vezes falta capacidade na região |

Recomendo **Hetzner** pela simplicidade (é MVP, €4 não dói). Se quer €0 estrito, **Oracle Always Free**.
Os comandos abaixo funcionam igual nos dois (Docker resolve x86 vs ARM sozinho no build).

Ao criar a máquina:
- Imagem: **Ubuntu 24.04**
- Abra as portas **22, 80, 443** (firewall do provedor)
- Guarde o **IP público**

### ⚠️ Pegadinhas da Oracle Always Free (leia se for Oracle)

1. **Use ARM, não o micro x86.** Escolha shape **VM.Standard.A1.Flex** (Ampere/ARM) com
   **2 OCPU + 12 GB** (cabe no always-free de 4 OCPU/24GB). O `next build` roda na própria
   VM e o micro x86 (1 GB RAM) provavelmente dá **out of memory**. Se a Oracle reclamar de
   *"out of capacity"*, troque o Availability Domain ou tente de novo mais tarde.
2. **Usuário SSH é `ubuntu`, não `root`.** Conecte com `ssh ubuntu@IP` (guarde a chave privada
   que a Oracle gera/você sobe). Comandos que mexem no sistema pedem `sudo`.
3. **Firewall em DUAS camadas** — HTTPS não funciona até abrir as duas:
   - **VCN Security List** (no painel Oracle): adicione Ingress `0.0.0.0/0` TCP **80** e **443**.
   - **iptables do Ubuntu** (a imagem da Oracle bloqueia tudo menos o 22). Dentro da VM:
     ```bash
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
     sudo netfilter-persistent save
     ```

---

## 1. Apontar o domínio (opcional, mas recomendado pra HTTPS)

No painel do seu domínio, crie um registro **A**:

```
hub.seudominio.com.br  →  IP_DO_VPS
```

Sem domínio dá pra testar por IP (ver passo 5), mas sem HTTPS.

---

## 2. Instalar Docker no VPS

Conecte via SSH (`ssh root@IP_DO_VPS`) e rode:

```bash
curl -fsSL https://get.docker.com | sh
```

Confirme:

```bash
docker --version && docker compose version
```

---

## 3. Levar o código pro VPS

Opção A — clonar do GitHub (mais simples se o repo estiver acessível):

```bash
git clone <URL_DO_SEU_REPO> atlas_hub
cd atlas_hub/hub-atlas
```

Opção B — repo privado sem credencial no VPS: gere um deploy key ou copie a pasta
`hub-atlas/` via `scp` do seu PC:

```powershell
# rode no SEU PC (PowerShell), dentro de Documents\atlas_hub
scp -r hub-atlas root@IP_DO_VPS:/root/
```

---

## 4. Configurar o `.env`

Dentro de `hub-atlas/` no VPS:

```bash
cp .env.vps.example .env
nano .env
```

Preencha:
- `DOMAIN` — seu subdomínio (ou veja passo 5 pra testar sem domínio)
- `POSTGRES_PASSWORD` — uma senha forte, e **repita a mesma** nas duas URLs (`DATABASE_URL`/`DIRECT_URL`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET` — do seu Clerk

---

## 5. Subir 🚀

```bash
docker compose up -d --build
```

O que acontece em ordem: `db` sobe e fica saudável → `migrator` aplica as migrations e
encerra → `app` sobe → `caddy` pega o certificado e começa a servir.

Acompanhe:

```bash
docker compose logs -f app
```

Abra `https://hub.seudominio.com.br` — deve ver a landing.

> **Testar sem domínio:** edite o `Caddyfile`, troque a 1ª linha `{$DOMAIN} {` por `:80 {`,
> rode `docker compose up -d caddy` e acesse `http://IP_DO_VPS` (sem HTTPS, só pra validar).

---

## 6. Seed inicial (uma vez)

Cria os estágios do pipeline e dados iniciais. Rode **uma vez**, depois que subiu:

```bash
docker compose run --rm migrator npx prisma db seed
```

---

## 7. Apontar o Clerk pro novo endereço

No dashboard do Clerk:

1. **Webhook** → endpoint `https://hub.seudominio.com.br/api/webhooks/clerk`
   com os eventos `user.created`, `user.updated`, `user.deleted`. Confira que o
   **Signing Secret** bate com o `CLERK_WEBHOOK_SIGNING_SECRET` do `.env`.
2. Instância `test` aceita qualquer origem — login funciona de cara.

Virar admin: `Sign up` na URL → no Clerk, seu usuário → Metadata → Public → `{ "role": "admin" }` → logout/login.

---

## 8. (Opcional) Trazer os dados do Neon

Se já tem dados no Neon que quer preservar, antes ou depois do passo 5:

```bash
# 1) dump do Neon (use a DIRECT_URL/connection string do Neon)
pg_dump "postgresql://...NEON_DIRECT_URL..." \
  --no-owner --no-privileges --format=custom -f neon.dump

# 2) restaura no Postgres local do VPS
docker compose cp neon.dump db:/tmp/neon.dump
docker compose exec db pg_restore -U atlas -d atlas --no-owner --clean --if-exists /tmp/neon.dump
```

Se ainda não tem dados relevantes, ignore — o `migrate deploy` + seed já deixam o banco pronto.

---

## 9. Atualizar o app (deploys seguintes)

```bash
cd atlas_hub/hub-atlas
git pull                       # ou reenvie os arquivos
docker compose up -d --build   # rebuild + migrations + restart, sem downtime perceptível
```

---

## 10. Backup do banco (não pule isto)

Postgres local não tem backup gerenciado como o Neon — configure você. Backup diário simples:

```bash
# cria /root/backup-db.sh
cat > /root/backup-db.sh <<'SH'
#!/bin/bash
cd /root/atlas_hub/hub-atlas
mkdir -p /root/backups
docker compose exec -T db pg_dump -U atlas -d atlas --format=custom \
  > /root/backups/atlas-$(date +%F).dump
find /root/backups -name 'atlas-*.dump' -mtime +14 -delete
SH
chmod +x /root/backup-db.sh

# agenda pra 3h da manhã todo dia
(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup-db.sh") | crontab -
```

Dica: mande esses dumps pra fora do VPS (S3, Backblaze B2, ou até `scp` pro seu PC) de vez em quando.

---

## Resumo do que mudou vs. Cloud Run

- `docker-compose.yml`, `Caddyfile`, `.env.vps.example`, `DEPLOY-VPS.md` — novos, pro VPS.
- `Dockerfile` — ganhou o stage `migrator` (leve, só migrations/seed). O resto é igual.
- `cloudbuild.yaml` / `DEPLOY.md` — pode manter como referência, mas não são mais usados.
- Neon — não é mais necessário; o Postgres roda no VPS.
