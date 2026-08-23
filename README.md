# HookGuard

[![License: MIT](https://img.shields.io/badge/license-MIT-pink.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Uniswap v4](https://img.shields.io/badge/Uniswap-v4-FF007A.svg)](https://docs.uniswap.org/contracts/v4/overview)
[![Chain access](https://img.shields.io/badge/chain-read--only-222.svg)](docs/DEPLOYMENT.md)

Open-source **evidence-backed security intelligence** for [Uniswap v4](https://docs.uniswap.org/contracts/v4/overview) hooks.

HookGuard is not another hook directory, not generic v4 analytics, not a Solidity scanner, and not an AI auditor. It exists so developers, liquidity providers, researchers, and protocols can inspect **deployed** hooks with published evidence — then watch those hooks for on-chain changes.

**HookGuard does not replace a professional smart-contract audit.** It does not produce a numerical hook risk score. It does not send transactions or hold keys.

## Why Uniswap v4 security matters

A v4 pool can attach a hook. That contract runs *inside* the pool lifecycle: initialize, swap, modify liquidity, donate. The hook address itself encodes which callbacks the `PoolManager` will invoke (low 14 bits). The implementation can still be a proxy, an EOA-owned setter farm, or unverified bytecode.

LPs who treat “it is a Uniswap pool” as sufficient due diligence are looking at the wrong contract. HookGuard’s job is to make the hook inspectable.

## Features

| Surface | What you get |
| --- | --- |
| Registry | Hooks and pools from PoolManager `Initialize` events |
| Contract intelligence | Bytecode hash, proxy slots, ABI/selectors, `owner()` / roles, optional verified source |
| Findings | Severity, **confidence**, detection source, evidence JSON |
| Validation | Manual reviews (`CONFIRMED` / `FALSE_POSITIVE` / `NEEDS_CONTEXT`) — never auto-confirmed |
| Monitoring | Snapshots of implementation, admin, owner, bytecode, privileged selectors |
| Public pages | Shareable `/public/hooks/:address` without a risk number |
| Watch + alerts | Identifier-based watchlist; Telegram optional (`PENDING` if unset) |

## Supported networks

| Chain | ID | PoolManager |
| --- | --- | --- |
| Ethereum | 1 | `0x000000000004444c5dc75cB358380D2e3dE08A90` |
| Unichain | 130 | `0x1f98400000000000000000000000000000000004` |

## Published corpus (real deployments)

Indexed from live PoolManager logs during Phase 2C (2026-08-23). Not a user-count. Details in [docs/VALIDATION.md](docs/VALIDATION.md).

| | Ethereum | Unichain | Total |
| --- | ---: | ---: | ---: |
| Unique hooks | 865 | 15 | **880** |
| Pools | 2,757 | 48 | **2,805** |
| Inspected | 865 | 15 | **880** |
| Verified source | 0 | 0 | **0** |
| Findings | 4,138 | 94 | **4,232** |

20 real hooks were reviewed by hand (135 findings: 80 confirmed, 0 false positive, 55 needs context). Ethereum was short of chain tip; Unichain used a recent start block. Verified source was unavailable without explorer API keys.

## Architecture

```
Uniswap v4 PoolManager (Ethereum, Unichain)
        │  eth_getLogs / eth_call / getCode / getStorage  (read-only)
        ▼
   Fastify API  ── PostgreSQL
        ▲
   Next.js web (explorer, public pages, dashboard, methodology, research)
```

Pipelines (all CLI-driven, no production cron required):

1. **Index** `Initialize` → `Hook` + `Pool`
2. **Inspect** bytecode / source / proxy / permissions → `Contract`
3. **Analyze** published rules → `Finding`
4. **Monitor** consecutive snapshots → `SecurityEvent`
5. **Alert** watchlists → `AlertDelivery` (Telegram or pending)
6. **Report** landscape metrics → `reports/hookguard-security-landscape.{json,md}`

Diagrams (system, index, analyze, monitor, alert): [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).  
Operators (frontend / API / database / workers / RPC): [docs/OPERATOR.md](docs/OPERATOR.md).  
Local tour: [docs/DEMO.md](docs/DEMO.md).

## Limitations

- HookGuard does not replace a professional smart-contract audit.
- Absence of findings is not “safe.”
- Bytecode `CALL`/`DELEGATECALL`/`STATICCALL` means the opcode exists, not that it sits on `beforeSwap`.
- Extra unimplemented-flag callbacks are not automatically vulnerabilities.
- An EOA owner without discovered mutators is a fact, not critical risk.
- Watchlists use a browser identifier, not accounts.
- Historical indexing depends on archive RPC quality.
- This repository does not imply a hosted public instance, users, or TVL.

## Repository

```
apps/api          Fastify + Prisma
apps/web          Next.js (landing, dashboard, explorer, public pages)
packages/types    Shared domain types
packages/config   Environment configuration
packages/blockchain  Chains, indexer, analysis, monitoring
docs/             Architecture, methodology, validation, grant draft, deployment
docs/research/    Landscape report, risk summary, case studies, validation package
reports/          Generated security landscape (from `npm run report:risk`)
```

## Quick start

```bash
git clone <repo>
cd uniswap-hook-guard
chmod +x scripts/setup.sh
./scripts/setup.sh
docker compose up -d          # Postgres on localhost:5434
npm install
npm run db:generate
npm run db:migrate:deploy -w @hookguard/api
```

```bash
npm run dev:api    # http://localhost:3001/health  (liveness)
                   # http://localhost:3001/ready   (Postgres)
npm run dev:web    # http://localhost:3000
```

Walkthrough: [docs/DEMO.md](docs/DEMO.md).

Read-only indexing (no keys):

```bash
npm run index:v4 -- --chain=ethereum --max-blocks=5000
npm run inspect:contracts -- --chain=ethereum
npm run analyze:hooks -- --chain=ethereum
npm run monitor:hooks -- --chain=ethereum
```

Copy `.env.example` → `.env`. **Never commit secrets.** Production notes: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run test` | Vitest |
| `npm run build` | Packages, API, Next.js |
| `npm run index:v4` | Discover hooks (read-only) |
| `npm run inspect:contracts` | Bytecode / source / proxy facts |
| `npm run analyze:hooks` | Evidence-based rules (no scores) |
| `npm run monitor:hooks` | Snapshots and security events |
| `npm run alerts:retry` | Retry pending/failed Telegram deliveries |
| `npm run validate:apply` | Apply `data/validation/dataset.json` reviews |
| `npm run report:risk` | Generate landscape JSON + Markdown from the database |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Security methodology](docs/SECURITY-METHODOLOGY.md)
- [Risk framework](docs/RISK-FRAMEWORK.md)
- [Validation](docs/VALIDATION.md)
- [Security landscape report](docs/research/HOOKGUARD_SECURITY_REPORT.md)
- [Risk findings summary](docs/research/RISK_FINDINGS_SUMMARY.md)
- [Case studies](docs/research/CASE_STUDIES.md)
- [Validation report](docs/research/VALIDATION_REPORT.md)
- [Security playbook](docs/research/SECURITY_PLAYBOOK.md)
- [Developer guidance](docs/research/DEVELOPER_GUIDANCE.md)
- [Risk review checklist](docs/research/RISK_REVIEW_CHECKLIST.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Operator runbook](docs/OPERATOR.md)
- [Demo walkthrough](docs/DEMO.md)
- [Roadmap](docs/ROADMAP.md)
- [Grant draft](docs/GRANT.md)
- [Security model](docs/SECURITY-MODEL.md)

## Status

**Phase 6.5C — security intelligence playbook.** Product phases 0–6.5B are implemented. Numerical risk scoring is not.

## License

MIT
