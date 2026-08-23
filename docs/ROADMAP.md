# Roadmap

HookGuard is built in phases. The repository currently implements product Phases 0–3 (foundation through continuous monitoring). Numerical risk scoring is still not implemented.

## Phase 0 — Foundation (current)

- Monorepo (`apps/web`, `apps/api`, `packages/*`)
- Fastify API with `GET /health`
- PostgreSQL + Prisma schema (`Hook`, `Pool`, `Contract`, `Finding`)
- Environment-based configuration
- Chain module for Ethereum and Unichain
- Interfaces for indexer, analyzer, and risk engine
- Landing, dashboard, explorer, hook detail
- Empty states — no fake findings
- Docs, Vitest, Prettier

## Phase 1 — Hook indexing

- Implement `HookIndexer` against Uniswap v4 `PoolManager`
- Persist hooks and pools from `Initialize` and related events
- Backfill from `deploymentBlock`
- Explorer lists real addresses

## Phase 2 — Contract ingestion

- Fetch bytecode via viem
- Attach verified source when a provider is configured
- Populate `Contract` rows
- Surface verification status in the UI

## Phase 3 — Hook-specific analysis

- Implement `ContractAnalyzer` for v4 hooks only
- Permission flags (`beforeSwap`, `afterSwap`, `beforeAddLiquidity`, …)
- Access control, delta accounting, hook address mining, fee behavior
- Write `Finding` rows with category and severity

## Phase 4 — Risk engine and dashboard

- Implement `RiskEngine` as published, deterministic rules
- Fill `Hook.riskScore`
- Dashboard charts and finding filters
- Still no invented scores: unknown remains unknown

## Phase 5 — Ecosystem features

- Additional chains
- Alerts for newly deployed hooks
- Public API for protocols
- LP-oriented pool ↔ hook views

## Non-goals (all phases)

- AI-generated audits
- Generic Solidity scanners (Slither-as-a-product)
- Silent mock data in production UI
- Custody, trading, or hook deployment as a service
