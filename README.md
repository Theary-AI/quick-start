# SNH AI Integration Quickstart

Runnable demo for integrating with SNH AI products. Clone the repo, add credentials, and submit a real sandbox/staging request in minutes.

## Products

| Product | Status | Path | Docs |
| ------- | ------ | ---- | ---- |
| **Verification** | Available | [`/verification`](http://localhost:3000/verification) | [documentation.theary.ai](https://documentation.theary.ai) |
| **Public Records** | Available | [`/public-records`](http://localhost:3000/public-records) | [docs.pr.snh-ai.com](https://docs.pr.snh-ai.com) |

Public Records is **synchronous** (decision in the API response). Verification uses **webhooks** for long-running orders. Use only the credentials for the product(s) you have enabled.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a product.

### Public Records (first evaluate)

1. In `.env.local` set:

```env
PUBLIC_RECORDS_API_BASE_URL=https://cra.pr.stg.snh-ai.com
PUBLIC_RECORDS_API_KEY=eval-api-key-<your-key>
```

2. Open [http://localhost:3000/public-records](http://localhost:3000/public-records)
3. Submit the pre-filled sample → read `record_decision` and `search_queue`

Full walkthrough: [`PUBLIC_RECORDS.md`](PUBLIC_RECORDS.md)

### Verification

1. Set `AUTH_CLIENT_ID` / `AUTH_CLIENT_SECRET` (or `AUTH_TOKEN`) in `.env.local`
2. Run `npm run tunnel` if you need local webhooks
3. Open [http://localhost:3000/verification](http://localhost:3000/verification)

## Deploying

```bash
docker build -t snh-ai-quickstart .
docker run --rm -p 8080:8080 --env-file .env.local snh-ai-quickstart
```

See [`DEPLOY.md`](DEPLOY.md) for Cloud Run and related notes.

## Support

- Sandbox / staging access: `support@snh-ai.com`
- Public Records status: https://cra.pr.snh-ai.com/health
