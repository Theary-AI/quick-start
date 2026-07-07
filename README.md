# Theary Integration Quickstarts

Runnable, copy-pasteable examples for integrating with the **Theary** platform.
Each quickstart is self-contained so you can clone the repo, drop in a sandbox
token, and see a real integration working in minutes — without access to any
proprietary internals.

## Layout

Quickstarts are organized by **API** and then by **language / stack**, so the
repo can grow to cover more products and ecosystems over time:

```
apps/
  verification-api/          Background checks (employment & education)
    node/                    ✅ Next.js + TypeScript app (ngrok webhooks)
  public-records-api/        🟡 Reserved — coming soon
```

| API                | Stack                | Status      | Path                                                       |
| ------------------ | -------------------- | ----------- | ---------------------------------------------------------- |
| Verification API   | Next.js + TypeScript | ✅ Available | [`apps/verification-api/node`](apps/verification-api/node) |
| Public Records API | —                    | 🟡 Planned  | [`apps/public-records-api`](apps/public-records-api)       |

## Getting started

Pick a quickstart and follow its README. To start with background checks:

```bash
cd apps/verification-api/node
npm install
cp .env.example .env.local   # add your sandbox token
npm run dev
```

See [`apps/verification-api/node/README.md`](apps/verification-api/node/README.md)
for the full walkthrough (health check → create order → track searches →
receive signed webhooks over ngrok).

## Deploying

Prefer a hosted demo over a local ngrok tunnel? The app is fully containerized
and can run anywhere that runs a container.

```bash
# Build & run locally
docker build -t snh-ai-quickstart .
docker run --rm -p 8080:8080 --env-file .env.local snh-ai-quickstart

# Or deploy to your own Google Cloud Run project
gcloud auth login && gcloud config set project YOUR_PROJECT_ID
./deploy/cloud-run.sh
```

When hosted behind a TLS-terminating proxy (like Cloud Run) the app
auto-detects its own public URL and configures webhooks automatically — no
ngrok, and no need to set `PUBLIC_BASE_URL`. This repo ships **no**
deploy-specific config or secrets; you deploy into your own infrastructure and
provide credentials at runtime.

See [`DEPLOY.md`](DEPLOY.md) for the full guide (Docker, Cloud Run, Secret
Manager, and limitations).

## Adding a new quickstart

1. Create `apps/<api>/<stack>/`.
2. Add a focused README and a `.env.example` (never commit real secrets).
3. List it in the table above.

## Support

- Sandbox access & questions: `support@snh-ai.com`
- Status: <https://status.theary.ai>
