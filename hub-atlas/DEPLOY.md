# Deploy do Hub Atlas no Cloud Run

Runbook do primeiro deploy. Rode tudo a partir da pasta `hub-atlas/`, no **Git Bash**
(o mesmo terminal que o Claude usa). Docker **não** é necessário — o Cloud Build
compila a imagem na nuvem.

> Dica: no Claude Code você pode rodar cada comando digitando `! <comando>` no prompt,
> que a saída cai direto na conversa.

---

## 0. Instalar o gcloud (única ferramenta local necessária)

Baixe o Google Cloud SDK: https://cloud.google.com/sdk/docs/install-sdk
Depois de instalar, feche e reabra o terminal e confirme:

```bash
gcloud --version
```

---

## 1. Login e projeto

```bash
gcloud auth login

# Crie um projeto novo (ou use um existente sob o crédito de US$300).
# Troque ATLAS_PROJECT_ID por um id único e minúsculo, ex: atlas-hub-prod-01
gcloud projects create ATLAS_PROJECT_ID --name="Atlas Hub"
gcloud config set project ATLAS_PROJECT_ID

# Vincule o billing (necessário pro Cloud Run). Liste suas contas:
gcloud billing accounts list
gcloud billing projects link ATLAS_PROJECT_ID --billing-account=XXXXXX-XXXXXX-XXXXXX
```

Guarde o número do projeto — vamos usar nas permissões:

```bash
export PROJECT_ID=$(gcloud config get-value project)
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
export REGION=us-east1
echo "$PROJECT_ID / $PROJECT_NUMBER / $REGION"
```

---

## 2. Habilitar as APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

---

## 3. Criar o repositório de imagens (Artifact Registry)

```bash
gcloud artifacts repositories create hub-atlas \
  --repository-format=docker \
  --location="$REGION" \
  --description="Imagens do Hub Atlas"
```

---

## 4. Criar os secrets (Secret Manager)

Esta função lê os valores **do seu `.env` local** e cria os secrets — assim você não
copia/cola chave nenhuma na mão. Rode dentro de `hub-atlas/`:

```bash
create_secret () {
  local key="$1"
  local val
  val=$(grep -E "^${key}=" .env | sed -E "s/^${key}=//; s/^\"//; s/\"$//")
  if [ -z "$val" ]; then echo "!! $key vazio no .env"; return 1; fi
  printf '%s' "$val" | gcloud secrets create "$key" --data-file=- 2>/dev/null \
    || printf '%s' "$val" | gcloud secrets versions add "$key" --data-file=-
  echo "ok: $key"
}

create_secret DATABASE_URL
create_secret DIRECT_URL
create_secret CLERK_SECRET_KEY
create_secret CLERK_WEBHOOK_SIGNING_SECRET
```

---

## 5. Permissões (IAM)

O Cloud Build precisa poder deployar no Cloud Run, e o serviço em runtime precisa ler
os secrets.

```bash
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Cloud Build: deployar no Run + agir como a service account de runtime
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CLOUD_BUILD_SA}" --role="roles/run.admin"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CLOUD_BUILD_SA}" --role="roles/iam.serviceAccountUser"

# Runtime do Cloud Run: ler os secrets
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" --role="roles/secretmanager.secretAccessor"
```

> Se o `gcloud builds submit` reclamar que a SA `${CLOUD_BUILD_SA}` não existe (projetos
> novos às vezes não criam a legada), rode `gcloud beta services identity create --service=cloudbuild.googleapis.com`
> ou use a SA de compute como builder. Me avise que ajusto.

---

## 6. Primeiro deploy 🚀

A publishable key do Clerk é pública (vai pro browser), então entra na linha de comando:

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _CLERK_PUBLISHABLE_KEY="$(grep -E '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' .env | sed -E 's/^[^=]+=//; s/\"//g')"
```

Ao terminar, pegue a URL do serviço:

```bash
gcloud run services describe hub-atlas --region="$REGION" --format="value(status.url)"
```

Abra a URL no browser — você deve ver a landing e conseguir ir pro `/sign-up`.

---

## 7. Conectar o Clerk à URL de produção

No dashboard do Clerk (https://dashboard.clerk.com), na instância que tem essa
`pk_test_...`:

1. **Webhook**: crie um endpoint apontando pra `https://SUA-URL-DO-RUN/api/webhooks/clerk`,
   com os eventos `user.created`, `user.updated`, `user.deleted`. Copie o
   **Signing Secret** e confira se bate com o `CLERK_WEBHOOK_SIGNING_SECRET` do seu `.env`.
   Se for diferente, atualize o secret: `create_secret CLERK_WEBHOOK_SIGNING_SECRET`
   (depois de ajustar o `.env`) e refaça o deploy.
2. A instância `test` já aceita qualquer origem, então login funciona de cara na URL do Run.

---

## 8. Virar admin

1. Acesse a URL, faça **Sign up** com seu email.
2. No dashboard do Clerk → **Users** → seu usuário → **Metadata** → **Public**:
   ```json
   { "role": "admin" }
   ```
3. Faça logout/login. O webhook (ou o fallback on-demand) grava `role=ADMIN` no Postgres,
   e `/dashboard` libera.

---

## Depois (antes de cliente real)

- **Instância de produção do Clerk**: criar uma instância `production` (chave `pk_live_`),
  ligada ao seu domínio. Trocar a publishable key no deploy e o `CLERK_SECRET_KEY` no secret.
- **Domínio custom** no Cloud Run (mapear `hub.atlas...`).
- **CI/CD**: conectar este repo do GitHub ao Cloud Build como *trigger* (push na `main`
  → deploy automático) usando o mesmo `cloudbuild.yaml`.
- **Migrations futuras**: quando mudar o schema, rode `npx prisma migrate deploy` (usa a
  `DIRECT_URL`) antes/junto do deploy. O primeiro deploy não precisa — o schema já está
  aplicado no Neon.
```
