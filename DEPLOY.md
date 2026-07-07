# Deploying the quickstart

This app is a standard containerized [Next.js](https://nextjs.org) server. It
ships with a `Dockerfile` and a helper script for **Google Cloud Run**, but it
will run anywhere that can run a container (Fly.io, Render, ECS, a plain VM,
Kubernetes, etc.).

> **This repo is public and contains no deploy-specific configuration.** There
> are no baked-in project ids, service accounts, or secrets. You deploy into
> **your own** infrastructure and supply your own credentials at runtime as
> environment variables (see [`.env.example`](.env.example)).

## Configuration

All configuration is via environment variables — the exact same set the local
app uses. See [`.env.example`](.env.example) for the full list. The important
ones for a hosted deployment:

| Variable | Notes |
| --- | --- |
| `API_BASE_URL` | Required. Sandbox or production API base URL. |
| `AUTH_CLIENT_ID` / `AUTH_CLIENT_SECRET` | Client-credentials auth. Keep secret. |
| `WEBHOOK_SECRET` | HMAC secret used to sign & verify webhooks. |
| `PUBLIC_BASE_URL` | **Leave blank when hosted.** The app auto-detects its own public URL from the incoming request (`x-forwarded-host` / `x-forwarded-proto`), so webhooks are configured automatically behind a TLS-terminating proxy like Cloud Run. Set it only if you front the app with a custom domain and want to pin it. |
| `PUBLIC_RECORDS_*` | Only needed for the Public Records product. |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` | Optional. Set **both** to put a shared username/password in front of the hosted demo (see [Password-protecting the demo](#password-protecting-the-demo)). |

`ngrok` is **not** used when the app is publicly hosted — it's only for local
development. Do not set `PUBLIC_BASE_URL` to an ngrok URL in production.

## Run with Docker locally

```bash
# Build the image
docker build -t snh-ai-quickstart .

# Run it, passing your local config
docker run --rm -p 8080:8080 --env-file .env.local snh-ai-quickstart
# open http://localhost:8080
```

The container listens on `PORT` (default `8080`) and binds to `0.0.0.0`.

## Deploy to Google Cloud Run

### Option A — one-liner helper script (recommended)

```bash
# Authenticate once
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy (reads app config from .env.local)
./deploy/cloud-run.sh
```

Override defaults with environment variables:

```bash
GCP_PROJECT=my-project GCP_REGION=us-east1 SERVICE=my-quickstart ./deploy/cloud-run.sh
```

The script enables the required APIs, builds the image from the `Dockerfile` via
Cloud Build, deploys to Cloud Run with your `.env.local` values as runtime env
vars, and prints the service URL. Because the platform delivers webhooks as
unauthenticated POSTs, the service is deployed with `--allow-unauthenticated`;
inbound webhooks are still verified with your `WEBHOOK_SECRET`.

### Option B — plain gcloud

```bash
gcloud run deploy snh-ai-quickstart \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars API_BASE_URL=https://sandbox.theary.ai,AUTH_CLIENT_ID=...,AUTH_CLIENT_SECRET=...,WEBHOOK_SECRET=...
```

> Values with commas or slashes are awkward with `--set-env-vars`; prefer
> `--env-vars-file env.yaml` (a simple `KEY: 'value'` YAML file) for those, which
> is what the helper script does for you.

### Recommended: keep secrets in Secret Manager

For anything beyond a quick trial, store credentials in
[Secret Manager](https://cloud.google.com/secret-manager) instead of plain env
vars so they aren't visible in the Cloud Run service config:

```bash
# Create secrets (once)
printf %s "$AUTH_CLIENT_SECRET" | gcloud secrets create quickstart-auth-client-secret --data-file=-
printf %s "$WEBHOOK_SECRET"     | gcloud secrets create quickstart-webhook-secret      --data-file=-

# Reference them at deploy time
gcloud run deploy snh-ai-quickstart \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars API_BASE_URL=https://sandbox.theary.ai,AUTH_CLIENT_ID=... \
  --set-secrets AUTH_CLIENT_SECRET=quickstart-auth-client-secret:latest,WEBHOOK_SECRET=quickstart-webhook-secret:latest
```

Grant the Cloud Run service account `roles/secretmanager.secretAccessor` on those
secrets if it doesn't already have it.

## Password-protecting the demo

The service is deployed `--allow-unauthenticated` (required so the platform can
deliver webhooks), so by default anyone with the URL can open the UI. To put a
**shared username/password** in front of it, set both credentials — the app's
middleware (`middleware.ts`) then challenges every request with HTTP Basic Auth:

```bash
# In .env.local, then re-run ./deploy/cloud-run.sh
BASIC_AUTH_USER=demo
BASIC_AUTH_PASSWORD=some-strong-password
```

Or on an existing service without a full redeploy:

```bash
gcloud run services update snh-ai-quickstart \
  --region us-central1 \
  --update-env-vars BASIC_AUTH_USER=demo,BASIC_AUTH_PASSWORD=some-strong-password
```

Notes:

- The gate is **opt-in**: if either variable is unset (the default, e.g. local
  dev) it does nothing.
- The webhook endpoint `/api/webhooks/*` is **always exempt** — platform
  deliveries stay open and are verified via `WEBHOOK_SECRET`.
- This is an application-level password, portable to any host. If you instead
  want a true Google sign-in wall enforced by GCP, use
  [Identity-Aware Proxy](https://cloud.google.com/iap/docs/enabling-cloud-run)
  in front of Cloud Run (via an external HTTPS Load Balancer), routing
  `/api/webhooks/*` to an IAP-free backend so webhooks keep working.

## Notes & limitations

- **Webhook storage is in-memory.** Received webhooks are kept in a per-instance
  ring buffer (see `lib/webhooks/store.ts`). On Cloud Run, scaling to multiple
  instances or a cold start will drop the in-memory feed. For a demo, set
  `--min-instances 1 --max-instances 1` to keep a single warm instance. A real
  integration would persist events to a database.
- **Public exposure.** `--allow-unauthenticated` makes the service reachable by
  anyone. This is required so the platform can deliver webhooks. Use a strong
  `WEBHOOK_SECRET` and treat the deployment as a demo, not production.
