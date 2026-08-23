# HookGuard — risk findings summary

Audience: Uniswap Foundation / ecosystem tooling reviewers.

Status: software in this repository and a generated snapshot of the **indexed corpus**. Not a hosted product with users. Not an audit firm.

**HookGuard does not replace a professional smart-contract audit.**

Snapshot: `2026-08-23T12:16:51.621Z` from `npm run report:risk`. Full narrative: [HOOKGUARD_SECURITY_REPORT.md](./HOOKGUARD_SECURITY_REPORT.md). Machine output: [`reports/hookguard-security-landscape.md`](../../reports/hookguard-security-landscape.md).

This document does not claim users, adoption, TVL, partnerships, confirmed exploits, malice, or stolen funds.

---

## Executive summary

HookGuard is open-source **evidence-backed security intelligence** for deployed Uniswap v4 hooks.

It discovers hooks from `PoolManager` `Initialize` events, inspects bytecode and permissions, publishes findings with evidence, correlates **multiple facts** into a risk taxonomy, and can generate a deterministic landscape report.

On this snapshot:

| | |
| --- | ---: |
| Networks | Ethereum, Unichain |
| Hooks analyzed | **880** |
| Pools indexed | **2,805** |
| Findings | **5,066** |
| Unique hooks with correlated `UPGRADE_SECURITY` | **2** |
| Unique hooks with correlated `FUND_SAFETY` | **17** |
| Unique hooks with `EXTERNAL_EXECUTION` (callback + CALL/DELEGATECALL) | **815** |
| Correlated `SWAP_SECURITY` / `ORACLE_SECURITY` / `ADMIN_CONTROL` | **0** |

The zeros are intentional conservatism, not missing scanners. Fee, oracle, and admin-control correlations require named or known-selector setters **and** privileged control **and** the relevant callback. This corpus has **zero verified-source** contracts, so those ANDs rarely complete.

Findings mean: **security-relevant capabilities and configurations**. They do not mean confirmed exploits.

---

## Key observations

1. **Most v4 hooks in this corpus sit on the swap path.** 789 of 880 hooks encode `beforeSwap`; 335 encode `afterSwap`. LPs who treat “it is a Uniswap pool” as sufficient due diligence are looking at the wrong contract.

2. **External execution is the modal capability, not a rare bug.** 815 hooks combine a lifecycle callback with bytecode `CALL` and/or `DELEGATECALL`. Without verified source, HookGuard does **not** claim those calls sit in `beforeSwap`. The honest statement is: the opcode exists alongside callbacks.

3. **Upgradeability of swap-path logic is rare in this set, and high impact when correlated.** 22 hooks look like proxies; only **2** also have a swap callback **and** an upgrade authority. Those two are the only `CRITICAL` findings (potential impact of EOA-replaceable swap logic — still not an exploit proof).

4. **Privileged token-movement capability is uncommon but real.** 17 hooks combine transfer/transferFrom selectors with an owner/admin. Evidence includes the controller address and mover selectors. Reachability is not proven.

5. **Named fee and oracle control did not correlate.** 0 `SWAP_SECURITY`, 0 `ORACLE_SECURITY`. That is a measurement of **this** unverified corpus against strict rules, not a claim that no v4 hook can change fees.

6. **Manual validation remains separate from the risk layer.** 20 real hooks / 135 observation findings were reviewed: 80 confirmed, 0 false positives, 55 needs context. Risk-taxonomy rows inherit evidence; they were not re-labeled as exploits.

---

## Risk distribution

Unique hooks affected (not finding rows):

| Category | Hooks | What the AND requires |
| --- | ---: | --- |
| FUND_SAFETY | 17 | Token-transfer capability + privileged control |
| SWAP_SECURITY | 0 | Swap callback + fee setter + privileged control |
| UPGRADE_SECURITY | 2 | Proxy + swap callback + upgrade authority |
| ADMIN_CONTROL | 0 | Owner/admin + named configuration mutators |
| ORACLE_SECURITY | 0 | Oracle setter + privileged control + price-sensitive callback |
| EXTERNAL_EXECUTION | 815 | Lifecycle callback + CALL/DELEGATECALL |
| PERMISSION_SECURITY | 0 | Reserved; extra callbacks are not auto-vulns |

Severity (potential impact, **not** confirmed exploitation):

| | Findings | Unique hooks |
| --- | ---: | ---: |
| CRITICAL | 2 | 2 |
| HIGH | 15 | 15 |
| MEDIUM | 2 | 2 |
| LOW | 2,305 | 843 |

Confidence (evidence strength):

| Band | Findings |
| --- | ---: |
| CONFIRMED (manual review) | 80 |
| STRONG (HIGH evidence) | 1,121 |
| OBSERVED (medium/low / unnamed) | 3,865 |

HookGuard does **not** fold these tables into a numerical score.

---

## Why this matters for the Uniswap v4 ecosystem

Uniswap v4 made hooks a first-class execution path inside the pool. Permission bits live in the hook address; the implementation can still be a proxy, EOA-owned, or unverified bytecode.

Point-in-time audits (including subsidized reviews) cannot watch implementation slots afterward. A generic Solidity scanner does not know `PoolManager.unlock` or hook-address flags. A hook directory without evidence is not security intelligence.

HookGuard’s grant-relevant output is:

- a **reproducible corpus** of real Ethereum + Unichain deployments
- **published rules** with evidence, not AI prose
- a **risk taxonomy** that refuses to fire on a single weak signal
- a **landscape report** operators can regenerate from the database
- a **validation sample** that refuses to convert heuristics into confirmed vulnerabilities

That is complementary to audits. It is not a substitute.

---

## Future improvements

Not built, not claimed:

- Additional canonical v4 chains
- Archive RPC so Ethereum indexing can finish at tip
- Explorer API keys so verified-source rates (and source-bound CALL association) are measurable on mainnet
- Manual review of the risk-taxonomy subset (currently the 20-hook set covers observation rules)
- Operator scheduling for `monitor:hooks` (this snapshot has 0 monitored hooks)
- Account-backed watchlists

**Not planned:** numerical risk scores, AI-written findings, exploit simulation, transaction execution.

Success is **published evidence about real hooks**, not a count of “vulnerabilities found.”
