# Operator runbook

Read-only Uniswap v4 intelligence. No keys, no `sendTransaction`. Pair this with [DEPLOYMENT.md](./DEPLOYMENT.md).

## Production architecture

```
                    ┌──────────────┐
   browsers  ──────►│  Next.js web │  NEXT_PUBLIC_API_URL
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────┐
                    │  Fastify API │  /health  (liveness, no DB)
                    │              │  /ready   (Postgres ping)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │  facts, findings, snapshots, watches
                    └──────────────┘

   operators  ──► CLI workers (index / inspect / analyze / monitor / alerts:retry)
                           │
                    ┌──────▼───────┐
                    │ RPC providers│  Ethereum + Unichain  (read-only)
                    └──────────────┘
```

| Piece | Process | Notes |
| --- | --- | --- |
| Frontend | `npm run start -w @hookguard/web` | Next.js. Talks only to the public API URL. |
| API | `npm run start -w @hookguard/api` | Fastify. Owns Prisma. |
| Database | PostgreSQL 16 | Source of truth. Back up before migrations. |
| Workers | npm CLIs | Not daemons. Schedule with systemd/CronJob. |
| RPC | `RPC_URL_ETHEREUM`, `RPC_URL_UNICHAIN` | Archive-capable for historical `getLogs`. |

## Health

| Probe | URL | Fail when |
| --- | --- | --- |
| Liveness | `GET /health` | Process is down (does not query Postgres) |
| Readiness | `GET /ready` | HTTP 503 or `database: down` |

Do not cache these responses.

## Worker order

Always this sequence on a chain:

```bash
npm run index:v4 -- --chain=ethereum
npm run inspect:contracts -- --chain=ethereum
npm run analyze:hooks -- --chain=ethereum
npm run monitor:hooks -- --chain=ethereum
npm run alerts:retry
npm run report:risk              # reports/hookguard-security-landscape.{json,md}
npm run analyze:hooks:research   # re-analyze corpus + reports/hookguard-security-analysis-results.{json,md} + reports/evidence/
npm run analyze:bytecode         # CFG reachability + reports/bytecode-analysis-results.{json,md}
npm run analyze:interactions     # CALL targets + reports/hookguard-interaction-analysis.* + docs/research/HOOK_*INTERACTION*
```

Repeat for `--chain=unichain`. Checkpoints live in `indexer_checkpoints`. Re-running index resumes; it does not start from genesis if a checkpoint exists.

### RPC failures

- “range too large” / “method handler crashed”: the indexer splits the window; a single bad block may be skipped.
- Use a dedicated archive URL in production. Public endpoints are for development.
- Lower `INDEX_BATCH_SIZE` if logs still fail.

### Alerts

If `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` is unset, deliveries stay `PENDING`. After configuring Telegram, run `npm run alerts:retry`. Failures increment `attempts` (cap 5).

### Database

```bash
npm run db:migrate:deploy -w @hookguard/api
```

`/corpus` returning 503 usually means Postgres is unreachable — check `DATABASE_URL` and `/ready`.

## CORS

Set `CORS_ORIGIN` to the public web origin in production (comma-separated list). Wildcard `*` is rejected when `NODE_ENV=production`. Same-origin reverse proxy (web and API under one host) can omit CORS.
