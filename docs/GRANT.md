# HookGuard — grant draft

This is a **draft** for Uniswap ecosystem / tooling grant reviewers. It describes the software as it exists in this repository. It does not claim users, TVL, or a hosted public deployment.

HookGuard does not replace professional smart-contract audits.

## Problem

Uniswap v4 lets anyone attach a **hook** to a pool. The hook runs inside the pool lifecycle (`beforeSwap`, `afterSwap`, liquidity callbacks, and related `IHooks` entry points). Those callbacks can change fees, call other contracts, upgrade implementation, or settle deltas with the singleton `PoolManager`.

That is a new security surface:

- Liquidity providers cannot read a hook the way they read a Uniswap v3 pool.
- A hook address encodes permission flags in its low bits; the implementation may not match those flags.
- Many hooks will be unverified, proxied, or owner-controlled.
- Audits (including Uniswap Foundation Security Fund subsidies) are point-in-time. Deployed hooks can change after listing.

Existing tools are a poor fit:

- A generic Solidity scanner does not know `PoolManager.unlock` or hook-address flags.
- A hook *registry* without evidence is a directory, not security intelligence.
- An AI auditor cannot be the source of findings if the product must be reviewable.

## Solution

HookGuard is **evidence-backed security intelligence for deployed Uniswap v4 hooks**.

It is read-only. It does not score hooks numerically, generate AI audits, send transactions, or custody keys.

What it does:

1. **Discover** hooks from PoolManager `Initialize` events on Ethereum and Unichain.
2. **Inspect** bytecode, optional verified source, EIP-1967 proxy slots, and `owner()` / role facts.
3. **Publish findings** with severity, confidence, detection source, and evidence JSON.
4. **Validate** a real-deployment sample so heuristic rules are not presented as facts.
5. **Monitor** consecutive snapshots (implementation, admin, owner, bytecode, privileged selectors).
6. **Expose** public hook pages, watchlists, and optional Telegram alerts.

Users are expected to read the evidence and decide for themselves.

## Uniswap ecosystem benefit

| Audience | Benefit |
| --- | --- |
| Hook developers | See how a deployment looks to outsiders: flags, proxy slots, privileged selectors. |
| LPs and integrators | Inspect the hook attached to a pool before committing capital. |
| Researchers | A reproducible corpus of real v4 hooks and published rules. |
| Protocols | A public JSON API (`GET /public/hooks/:address`, `/events/recent`, `/health`) without running a scanner themselves. |
| Audit programs | Complementary to point-in-time audits: continuous facts after deploy, not a substitute for UFSF-subsidized reviews. |

HookGuard is scoped to **v4 hooks**, not arbitrary contracts. That keeps the rule set honest.

## Verified metrics (this repository)

From the Phase 2C run against **real** Uniswap v4 PoolManager logs. See [VALIDATION.md](./VALIDATION.md). These are indexer/analyzer outputs, not product usage metrics.

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

Not claimed: monthly active users, production uptime, Telegram subscribers, or that the Ethereum index reached chain tip.

## Milestones (completed in this repo)

| Phase | Outcome |
| --- | --- |
| 0 | Monorepo, Fastify + Prisma, Next.js UI, health, empty states |
| 1 | PoolManager `Initialize` indexer, explorer |
| 2A | Contract intelligence (bytecode, source, proxy, ABI, permissions) |
| 2B | Evidence-based finding engine (no scores) |
| 2C | Confidence, detection source, validation on real Ethereum + Unichain hooks |
| 3 | Snapshot comparison and security events |
| 4 | Public pages, watchlists, Telegram-optional alerts |
| 5 | Launch documentation, grant draft, deployment notes |

## Future roadmap (not built)

- Additional v4 chains once PoolManager deployments are canonical.
- Verified-source coverage when explorer keys are available (empirical, not unit-test-only).
- Finish historical Ethereum indexing with a reliable archive RPC.
- Operator-grade scheduling for `monitor:hooks` (still a manual CLI today).
- Account-backed watchlists (today: client identifier, no auth).
- **Not planned for launch:** numerical risk scores, AI-written findings, transaction execution.

## Ask (draft)

Funding would go to:

1. Archive RPC and explorer APIs so the public corpus is complete and verified-source rates are measurable.
2. A hosted read-only instance (API + web + Postgres) with documented health checks.
3. Continued validation of existing rules on new deployments — not a flood of speculative detectors.

Success looks like **published evidence about real hooks**, not a count of “vulnerabilities found.”
