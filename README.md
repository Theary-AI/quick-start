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

## Adding a new quickstart

1. Create `apps/<api>/<stack>/`.
2. Add a focused README and a `.env.example` (never commit real secrets).
3. List it in the table above.

## Support

- Sandbox access & questions: `support@snh-ai.com`
- Status: <https://status.theary.ai>
