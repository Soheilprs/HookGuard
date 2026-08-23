# Roadmap

HookGuard is built in numbered product phases. **Phases 0–7A are implemented in this repository.** Numerical risk scoring is **not** implemented and is not a launch requirement.

HookGuard does not replace a professional smart-contract audit.

## Done

| Phase | Name | What shipped |
| --- | --- | --- |
| 0 | Foundation | Monorepo, Fastify health, Prisma schema, Next.js empty states |
| 1 | Discovery | PoolManager `Initialize` indexer, explorer |
| 2A | Intelligence | Bytecode, optional verified source, proxy, ABI, permissions |
| 2B | Findings | Evidence-based rules (proxy, ownership, lifecycle, calls, privileged) |
| 2C | Validation | Confidence, detection source, real Ethereum + Unichain corpus, methodology UI |
| 3 | Monitoring | Snapshots and security events |
| 4 | Public product | Public pages, watchlists, optional Telegram alerts |
| 5 | Launch docs | README, architecture, methodology, validation, grant draft, deployment |
| 6 | Launch / grant prep | `/ready`, CORS, operator runbook, demo walkthrough |
| 6.5A | Risk framework | Capability correlations (no scores, no exploit claims) |
| 6.5B | Landscape reporting | Deterministic reports from the database, `docs/research/`, `/research` |
| 6.5C | Security playbook | Guidance, review questions, and checklists attached to findings (no new rules) |
| 7A | Hook security analyzer | Source-first detectors for v4 callback-path patterns (no generic scanner, no scores) |

## Next (not built)

- Additional canonical v4 chains
- Archive RPC so Ethereum indexing can finish at tip
- Explorer keys so verified-source rates are measurable on mainnet
- Operator scheduling for `monitor:hooks` / `alerts:retry`
- Account-backed watchlists (today: client identifier)

## Explicitly not in launch

- Numerical `riskScore`
- AI-written findings
- Transaction execution, custody, or hook deployment
- Generic Solidity scanning as the product

## Non-goals (all phases)

- Silent mock data in production UI
- Claiming users or TVL the repo cannot show
- Treating `NEEDS_CONTEXT` as confirmed to dress up metrics
