# Security model

HookGuard reasons about **Uniswap v4 hooks**, not arbitrary contracts.

This document is the product philosophy. See also [SECURITY-METHODOLOGY.md](./SECURITY-METHODOLOGY.md) and [VALIDATION.md](./VALIDATION.md).

## What HookGuard is

A security **intelligence** platform:

- Discover hooks and the pools that use them.
- Inspect hook contracts with v4-specific rules.
- Publish structured findings with evidence, confidence, and detection source.

Users are expected to make their own decisions. HookGuard is not a guarantee, insurance product, or audit firm.

## What HookGuard is not

- **Not an AI auditor.** Models may assist documentation later; they must not be the source of findings or scores.
- **Not a generic scanner.** A reentrancy heuristic that ignores `PoolManager.unlock` and hook permissions is out of scope.
- **Not a substitute for review.** HookGuard does not replace a professional smart-contract audit. An empty finding list is not “clean.”

## Trust boundaries

```
Wallet user / LP
    → Dashboard (untrusted client)
        → API (trusted compute, no user secrets stored)
            → PostgreSQL (indexed facts + findings)
            → RPC (chain data; treat as untrusted input)
```

- The API never holds user private keys.
- RPC URLs and database credentials live in environment variables.
- Wallet connection (RainbowKit) is client-side only.

## Facts vs. judgments

| Kind | Examples | Rule |
| --- | --- | --- |
| Fact | address, chainId, bytecode, pool fee, deployment block | Persist only what was observed |
| Judgment | severity, riskScore, category | Produced by published rules; nullable until run |

The UI must not invent judgments. Unscored hooks must not display a fabricated number. Launch does **not** fill `Hook.riskScore`.

## Uniswap v4 threat focus

Hooks run inside the v4 pool lifecycle. Analysis should concentrate on:

1. **Hook permissions** — which callbacks are enabled (`Hooks.Permissions`) versus which are implemented.
2. **Access control** — who can change fees, withdraw, or upgrade.
3. **Delta accounting** — whether the hook settles `BalanceDelta` correctly with the `PoolManager`.
4. **External calls** — tokens, oracles, or untrusted contracts invoked from callbacks.
5. **Fee collection** — custom accounting that can siphon LP or swapper value.
6. **Upgradeability / replaceability** — proxy patterns or owner-controlled logic swaps.
7. **PoolManager assumptions** — singleton `unlock` callback, `msg.sender` is the manager, transient storage.

Generic bytecode metrics (instruction counts, “complexity”) are not risk.

## Scoring

**Not implemented.** `Hook.riskScore` stays null. The public product shows findings, confidence, and events — not a 0–100 number.

A future deterministic mapping, if any, must be documented before it is displayed. Until then the UI must not invent scores.

## Operational security

- No secrets in git (`.env` gitignored; examples only).
- Production `DATABASE_URL` is required; tests may use a local default.
- Health endpoint exposes no credentials — only service status and configured chain ids.
- Dependencies are pinned via the lockfile once `npm install` has been run.

## Responsible disclosure

If you find a vulnerability in HookGuard itself, do not open a public issue with an exploit. Contact the maintainers privately. Hook findings about *third-party hooks* are product data, not a disclosure channel for those projects.
