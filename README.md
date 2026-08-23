# HookGuard

Open-source **evidence-backed security intelligence** for [Uniswap v4](https://docs.uniswap.org/contracts/v4/overview) hooks.

HookGuard is not primarily another hook registry, a generic v4 analytics product, a generic smart-contract scanner, or an AI auditor. It exists so developers, liquidity providers, researchers, and protocols can inspect **deployed** hooks with published evidence.

HookGuard does not replace a professional smart-contract audit. It does not produce a numerical hook risk score.

## Product

| Surface | Purpose |
| --- | --- |
| Hook Registry | Canonical catalog of v4 hooks and the pools that use them |
| Security Analysis Engine | Evidence-based, hook-specific findings (permissions, lifecycle, proxy, external calls) |
| Findings UI | Severity, confidence, detection source, and evidence — not a risk score |

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
npm run analyze:hooks -- --chain=ethereum
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
| `npm run analyze:hooks` | Run evidence-based security rules (no scores) |
| `npm run validate:apply` | Apply manual validation reviews from `data/validation/dataset.json` |

## Tech stack

**Backend:** TypeScript, Node.js, Fastify, PostgreSQL, Prisma, viem  
**Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, wagmi, RainbowKit  
**Test / format:** Vitest, Prettier

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Security model](docs/SECURITY-MODEL.md)
- [Security methodology](docs/SECURITY-METHODOLOGY.md)
- [Validation](docs/VALIDATION.md)

## Status

**Phase 2C — validated findings.** Real Ethereum and Unichain hooks are indexed, inspected, and analyzed. Findings carry confidence, detection source, and optional manual validation status. No numerical risk scores.

## License

MIT
