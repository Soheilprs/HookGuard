# Deployment

HookGuard is a **frontend**, an **API**, a **database**, **CLI workers**, and **read-only RPC providers**. Everything that talks to a chain uses `eth_getLogs`, `eth_call`, `eth_getCode`, and `eth_getStorageAt`. There is no `PRIVATE_KEY`, mnemonic, or `sendTransaction`.

See [OPERATOR.md](./OPERATOR.md) for the runbook.

## Local

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
docker compose up -d
npm install
npm run db:generate
npm run db:migrate:deploy -w @hookguard/api
npm run dev:api    # http://localhost:3001/health
npm run dev:web    # http://localhost:3000
```

`docker compose` publishes Postgres on **host port 5434** (container 5432) so it does not collide with other local databases. Root `.env.example` uses `localhost:5434`.

## Production architecture

| Layer | What runs | Talks to |
| --- | --- | --- |
| **Frontend** | Next.js (`apps/web`) | Browser → API via `NEXT_PUBLIC_API_URL` |
| **API** | Fastify (`apps/api`) | Postgres, optional Telegram |
| **Database** | PostgreSQL 16 | API + workers through Prisma |
| **Workers** | `index:v4`, `inspect:contracts`, `analyze:hooks`, `monitor:hooks`, `alerts:retry` | RPC + Postgres |
| **RPC providers** | Ethereum + Unichain HTTPS endpoints | Workers only (read-only) |

Workers are not long-lived daemons. Schedule them. The API does not start indexing by itself.

## Health check

`GET /health` — **liveness**. No database. Safe for a process probe.

`GET /ready` — **readiness**. Pings PostgreSQL (`SELECT 1`). Returns **503** when the database is down.

Liveness payload (no auth, no secrets):

```json
{
  "status": "ok",
  "service": "hookguard-api",
  "version": "0.0.1",
  "timestamp": "…",
  "chains": [
    { "id": 1, "slug": "ethereum", "name": "Ethereum" },
    { "id": 130, "slug": "unichain", "name": "Unichain" }
  ]
}
```

Load balancers: `/health` → restart the process if it fails; `/ready` → stop sending traffic if it fails. The payload lists configured chain *metadata*, not RPC credentials.

Useful operator URLs:

| URL | Use |
| --- | --- |
| `GET /health` | Liveness (no DB) |
| `GET /ready` | Readiness (Postgres ping) |
| `GET /corpus` | Indexed counts (503 if the database is down) |
| `GET /stats` | Lightweight registry counts |

## Production configuration

Copy `.env.example` → `.env`. **Never commit `.env`.**

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` |
| `DATABASE_URL` | yes | PostgreSQL. API refuses to start in production without it. |
| `API_HOST` / `API_PORT` | no | Default `0.0.0.0:3001` |
| `RPC_URL_ETHEREUM` | strongly recommended | Public defaults exist for development. Historical `eth_getLogs` needs an archive-capable endpoint. |
| `RPC_URL_UNICHAIN` | strongly recommended | Default `https://mainnet.unichain.org` |
| `NEXT_PUBLIC_API_URL` | yes for web | Browser-visible API origin, e.g. `https://api.example.com` |
| `ETHERSCAN_API_KEY` / `UNISCAN_API_KEY` | no | Improves verified-source rate. Bytecode analysis still runs without them. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | no | If unset, alerts stay `PENDING`. |
| `CORS_ORIGIN` | production | Comma-separated web origins. `*` is rejected in production. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | no | Client-side connect only; the API never sees keys. |
| `INDEX_BATCH_SIZE` | no | Default 2000. Lower it if the RPC rejects log ranges. |
| `INDEX_START_BLOCK_*` | no | Used only when no indexer checkpoint exists. |

Build:

```bash
npm run test
npm run build
```

Run API from `apps/api`: `npm run start -w @hookguard/api` (after `prisma generate` and migrations).

Run web: `npm run start -w @hookguard/web` or put the Next.js output behind a reverse proxy.

### Database

```bash
npm run db:migrate:deploy -w @hookguard/api
```

Take backups of PostgreSQL before migrating. Prisma migrations are additive.

### Indexing and monitoring (operators)

These are **manual CLIs**, not production cron:

```bash
npm run index:v4 -- --chain=ethereum
npm run inspect:contracts -- --chain=ethereum
npm run analyze:hooks -- --chain=ethereum
npm run monitor:hooks -- --chain=ethereum
npm run alerts:retry
```

Schedule them with systemd timers, Kubernetes CronJobs, or similar if you operate a public instance. The process is still read-only.

Public RPCs often crash or cap `eth_getLogs`. Prefer a dedicated archive URL in production. The indexer splits oversized ranges and skips a single noisy block rather than aborting the whole backfill.

### Reverse proxy

- Terminate TLS in front of API (`3001`) and web (`3000`).
- Forward `/health` and `/ready` without caching.
- Do not expose Postgres.
- Set `CORS_ORIGIN` to the public web origin when the API is on a different host.

## Security notes

- Gitignore `.env`, `.env.local`.
- Telegram tokens and RPC keys are server-side only.
- Watchlists use a client identifier, not accounts. Do not treat that identifier as authentication.
- HookGuard does not replace a professional smart-contract audit.
