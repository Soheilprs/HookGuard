# HookGuard

Open-source **security intelligence** for [Uniswap v4](https://docs.uniswap.org/contracts/v4/overview) hooks.

HookGuard is a registry, analysis engine, and risk dashboard — not an AI auditor and not a generic smart-contract scanner. It exists so developers, liquidity providers, researchers, and protocols can understand hook security risk before capital is at stake.

The registry and contract intelligence layers are live. Security analysis and scoring are not implemented.

## Product

| Surface | Purpose |
| --- | --- |
| Hook Registry | Canonical catalog of v4 hooks and the pools that use them |
| Security Analysis Engine | Deterministic, hook-specific checks (permissions, lifecycle, PoolManager interaction) |
| Risk Dashboard | Scores and findings — empty until the engine has real results |

Supported chains in Phase 0 configuration: **Ethereum** (`1`) and **Unichain** (`130`).

## Repository

```
apps/
  api/             Fastify + Prisma
  web/             Next.js dashboard
packages/
  types/           Shared domain types
  config/          Environment-based configuration
  blockchain/      Chain registry + indexer/analyzer/risk interfaces
docs/              Architecture, roadmap, security model
scripts/           Local setup helpers
tests/             Workspace-level schema and frontend tests
```

Shared UI stays in `apps/web` (shadcn-style primitives). There is no `packages/ui` because those components are Next.js-specific.

## Quick start

```bash
git clone <repo>
cd uniswap-hook-guard
chmod +x scripts/setup.sh
./scripts/setup.sh
docker compose up -d
npm install
npm run db:generate
```

Then, in two terminals:

```bash
npm run dev:api    # http://localhost:3001/health
npm run dev:web    # http://localhost:3000
```

Index Uniswap v4 hooks (read-only, no keys):

```bash
npm run db:migrate:deploy -w @hookguard/api
npm run index:v4 -- --chain=ethereum --max-blocks=5000
npm run inspect:contracts -- --chain=ethereum
```

Copy `.env.example` values into `.env` files. **Never commit secrets.**

## Scripts

| Command | What it does |
| --- | --- |
| `npm install` | Install workspace dependencies |
| `npm run test` | Vitest (API health, schema, frontend foundation) |
| `npm run build` | Build packages, API, and Next.js app |
| `npm run format` | Prettier |
| `npm run db:generate` | Prisma client |
| `npm run db:validate` | Prisma schema check |
| `npm run index:v4` | Discover Uniswap v4 hooks (read-only) |
| `npm run inspect:contracts` | Collect hook bytecode / source / proxy facts |

## Tech stack

**Backend:** TypeScript, Node.js, Fastify, PostgreSQL, Prisma, viem  
**Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, wagmi, RainbowKit  
**Test / format:** Vitest, Prettier

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Security model](docs/SECURITY-MODEL.md)

## Status

**Phase 2A — contract intelligence.** Hooks are discovered from PoolManager events. Bytecode, source, proxy, and permission facts are collected. No scores.

## License

MIT
