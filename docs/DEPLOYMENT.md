# Deployment

HookGuard is two processes plus PostgreSQL. Everything that talks to a chain is **read-only** (`eth_getLogs`, `eth_call`, `eth_getCode`, `eth_getStorageAt`). There is no `PRIVATE_KEY`, mnemonic, or `sendTransaction`.

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

## Health check

`GET /health` (no auth, no secrets):

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

Load balancers should treat non-200 or `status !== "ok"` as unhealthy. The payload lists configured chain *metadata*, not RPC credentials.

Useful operator URLs:

| URL | Use |
| --- | --- |
| `GET /health` | Liveness |
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
- Forward `/health` without caching.
- Do not expose Postgres.
- CORS is currently `origin: true` for local development; lock this down for a public host.

## Security notes

- Gitignore `.env`, `.env.local`.
- Telegram tokens and RPC keys are server-side only.
- Watchlists use a client identifier, not accounts. Do not treat that identifier as authentication.
- HookGuard does not replace a professional smart-contract audit.
