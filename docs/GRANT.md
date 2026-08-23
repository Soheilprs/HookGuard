# HookGuard — grant draft

**Status:** software in this repository, not a hosted product with users.

This draft is for Uniswap ecosystem / tooling reviewers. It uses only metrics produced by the indexer, inspector, analyzer, and a 20-hook manual review. It does not claim users, adoption, TVL, partnerships, or a public production deployment.

HookGuard does not replace professional smart-contract audits.

## Project summary

HookGuard is open-source **evidence-backed security intelligence for deployed Uniswap v4 hooks**.

It discovers hooks from PoolManager `Initialize` events on Ethereum and Unichain, inspects bytecode and permissions, publishes findings with confidence and evidence, validates a real-deployment sample, snapshots security-relevant state over time, and exposes public pages plus optional Telegram alerts.

It is **read-only**. It does not score hooks, write AI audits, send transactions, or hold keys.

## Ecosystem problem

Uniswap v4 lets a pool attach a hook that runs inside initialize, swap, and liquidity callbacks. Permission bits live in the hook address; the implementation can still be a proxy, EOA-owned, or unverified.

That is a new surface for LPs and integrators:

- You cannot treat “it is a Uniswap pool” as sufficient due diligence.
- Audits (including Uniswap Foundation Security Fund subsidies) are point-in-time; implementation slots and owners can change afterward.
- A generic Solidity scanner does not know `PoolManager.unlock` or hook-address flags.
- A hook directory without evidence is not security intelligence.
- An AI auditor cannot be the source of findings if the output must be reviewable.

## Solution

| Capability | What ships in this repo |
| --- | --- |
| Discover | `Initialize` logs → `Hook` + `Pool` |
| Inspect | Bytecode, EIP-1967, `owner()` / roles, optional verified source |
| Findings | Severity, confidence, detection source, evidence JSON |
| Validation | Manual `CONFIRMED` / `FALSE_POSITIVE` / `NEEDS_CONTEXT`; never auto-confirmed |
| Monitor | Snapshots of implementation, admin, owner, bytecode, privileged selectors |
| Public API / UI | `/public/hooks/:address`, watchlists, optional Telegram |

Users are expected to read the evidence.

## Uniswap ecosystem benefit

| Audience | Benefit |
| --- | --- |
| Hook developers | See flags, proxy slots, and privileged selectors the way an outsider does. |
| LPs and integrators | Inspect the hook attached to a pool before committing capital. |
| Researchers | A reproducible corpus and published rules. |
| Protocols | JSON (`GET /public/hooks/:address`, `/events/recent`, `/health`, `/ready`) without running a scanner. |
| Audit programs | Complementary to point-in-time audits — not a substitute for UFSF-subsidized reviews. |

Scoped to **v4 hooks**, not arbitrary contracts.

## Verified metrics (this repository)

From the Phase 2C run against **real** PoolManager logs. [VALIDATION.md](./VALIDATION.md). Indexer/analyzer output, **not** product usage.

| Metric | Value |
| --- | ---: |
| Unique hooks indexed | 880 |
| Pools discovered | 2,805 |
| Ethereum hooks / pools | 865 / 2,757 |
| Unichain hooks / pools | 15 / 48 |
| Contracts inspected | 880 |
| Verified-source contracts | 0 (no explorer API keys in that run) |
| Findings generated | 4,232 |
| Hooks manually reviewed | 20 |
| Findings reviewed | 135 (80 confirmed, 0 false positive, 55 needs context) |
| Supported chains in code | Ethereum (`1`), Unichain (`130`) |
| License | MIT |

**Not claimed:** monthly active users, production uptime, Telegram subscribers, partnerships, TVL, or that the Ethereum index reached chain tip.

## Milestones and completed work

| Phase | Outcome |
| --- | --- |
| 0 | Monorepo, Fastify + Prisma, Next.js, `/health`, empty states |
| 1 | PoolManager `Initialize` indexer, explorer |
| 2A | Contract intelligence |
| 2B | Evidence-based findings (no scores) |
| 2C | Confidence, detection source, real Ethereum + Unichain validation |
| 3 | Snapshots and security events |
| 4 | Public pages, watchlists, Telegram-optional alerts |
| 5 | Launch docs, grant draft, deployment notes |
| 6 | `/ready`, CORS production rules, operator runbook, demo walkthrough |
| 6.5A | Risk taxonomy and AND-correlated capability findings (no scores) |
| 6.5B | Landscape report CLI, `docs/research/`, `/research` UI |
| 6.5C | Security playbook, developer guidance, review checklist (no new rules) |
| 7A | Hook-specific source analyzer (reentrancy window, unguarded setters, delegatecall in callbacks, custom accounting, permission mismatch) |
| 7B | Real-world corpus analysis + evidence package (no invented exploits) |

## Future roadmap (not built)

- Additional canonical v4 chains
- Verified-source coverage when explorer keys exist
- Finish historical Ethereum indexing with archive RPC
- Operator scheduling for `monitor:hooks` (still a manual CLI)
- Account-backed watchlists (today: client identifier)

**Not planned for launch:** numerical risk scores, AI-written findings, transaction execution.

## Ask (draft)

1. Archive RPC and explorer APIs so the public corpus is complete and verified-source rates are measurable.
2. A hosted **read-only** instance (web + API + Postgres) with `/health` and `/ready`.
3. Continued validation of **existing** rules on new deployments — not speculative detectors.

Grant-facing research package (same corpus, no invented metrics):

- [Security landscape report](./research/HOOKGUARD_SECURITY_REPORT.md)
- [Risk findings summary](./research/RISK_FINDINGS_SUMMARY.md)
- [Case studies](./research/CASE_STUDIES.md)
- [Validation report](./research/VALIDATION_REPORT.md)
- [Security playbook](./research/SECURITY_PLAYBOOK.md)
- [Developer guidance](./research/DEVELOPER_GUIDANCE.md)
- [Risk review checklist](./research/RISK_REVIEW_CHECKLIST.md)
- [Hook security analysis](./research/HOOK_SECURITY_ANALYSIS.md)
- [Real-world analysis](./research/REAL_WORLD_HOOK_ANALYSIS.md)

Phase 7B corpus run: 880 hooks analyzed, **0** verified source, **409** bytecode `DANGEROUS_DELEGATECALL` review signals (LOW; not callback-bound). Source-gated detectors emitted 0 rather than inventing bindings.
- Generated snapshot: [`reports/hookguard-security-landscape.md`](../reports/hookguard-security-landscape.md) (`npm run report:risk`)

After the risk-correlation layer, the same 880 hooks produced **5,066** findings (Phase 2C observation-only total was 4,232). Unique-hook risk categories in that snapshot: `FUND_SAFETY` 17, `UPGRADE_SECURITY` 2, `EXTERNAL_EXECUTION` 815, `SWAP_SECURITY` / `ORACLE_SECURITY` / `ADMIN_CONTROL` / `PERMISSION_SECURITY` 0.

Success is **published evidence about real hooks**, not a count of “vulnerabilities found.”
