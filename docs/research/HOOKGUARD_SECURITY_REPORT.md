# HookGuard security landscape report

Snapshot generated at **2026-08-23T12:16:51.621Z** from the indexed PostgreSQL corpus via `npm run report:risk`. Figures are indexer and analyzer output, not user counts, TVL, or exploit proofs.

Machine-readable companion: [`reports/hookguard-security-landscape.json`](../../reports/hookguard-security-landscape.json).  
Markdown companion: [`reports/hookguard-security-landscape.md`](../../reports/hookguard-security-landscape.md).

HookGuard does not replace a professional smart-contract audit.

---

# Executive Summary

HookGuard analyzed **deployed** Uniswap v4 hooks on Ethereum and Unichain to identify **security-relevant capabilities and configurations** around:

- upgradeability
- swap execution
- administrative control
- asset management
- external execution

The analyzer does not invent observations. Every finding stores evidence JSON. Risk-taxonomy findings fire only when **multiple independent facts** correlate (for example: proxy **and** swap callback **and** upgrade authority).

This report describes the **current landscape** of those capabilities. It does **not** claim:

- confirmed exploits
- that a project is malicious
- that user funds were stolen
- a numerical hook risk score

**HookGuard does not replace a professional smart-contract audit.** Absence of a finding is not a clean bill of health. Presence of a finding is a recorded capability, not a proof of exploitability.

---

# Scope

| Item | This snapshot |
| --- | --- |
| Networks | Ethereum (`1`), Unichain (`130`) |
| Hooks analyzed | 880 |
| Pools indexed | 2,805 |
| Findings (all published rules) | 5,066 |
| Monitored hooks | 0 |
| Security events | 0 |
| Verified source in this corpus | 0 (no explorer API keys in the index/inspect run) |

## Methodology sources

- Uniswap v4 `PoolManager` `Initialize` event logs (hook discovery)
- `eth_getCode`, `eth_getStorageAt` (EIP-1967), `eth_call` (`owner()` / roles) — read-only
- Hook-address permission bits (low 14 bits)
- Optional verified ABI / source (Sourcify, Etherscan) when keys are present
- Deterministic analysis rules and AND-correlated risk rules

## Limitations

- Ethereum historical indexing did not finish at chain tip (public RPC skipped a noisy block).
- Unichain used a recent start block, not a genesis-to-tip scan.
- Zero verified-source contracts in this corpus: named ABI and source-bound CALL association were not measured on mainnet.
- Bytecode `CALL` / `DELEGATECALL` proves the opcode exists, not that it sits on `beforeSwap`.
- Unnamed selectors may collide; those observations stay low confidence.
- Monitoring snapshots were not run for this snapshot (`monitoredHooks = 0`).
- HookGuard remains **read-only**. It does not send transactions or hold keys.

---

# Methodology

```
Discovery
    ↓
Contract Intelligence
    ↓
Deterministic Rules
    ↓
Risk Correlation
    ↓
Evidence Generation
    ↓
Validation
```

| Stage | What happens |
| --- | --- |
| **Discovery** | Index `PoolManager.Initialize` logs. Persist `Hook` and `Pool`. |
| **Contract Intelligence** | Bytecode hash, selectors, EIP-1967 proxy slots, `owner()` / roles, optional verified source. |
| **Deterministic Rules** | Published observation rules (`proxy-used`, `ownership-owner`, hook-address flags, opcode walk, …). A finding is stored only with evidence. |
| **Risk Correlation** | A second layer: emit a taxonomy finding only when required facts **all** hold. Missing any fact → no risk finding. |
| **Evidence Generation** | Evidence JSON is copied onto the finding. Empty evidence is rejected. |
| **Validation** | Manual review (`CONFIRMED` / `FALSE_POSITIVE` / `NEEDS_CONTEXT`). The engine never auto-marks `CONFIRMED`. |

Severity and confidence are independent:

- **Severity** is potential impact of the observed capability.
- **Confidence** is evidence strength.

They are not a risk score.

---

# Ecosystem Findings

Figures below are copied from the generated landscape report. They are not hardcoded product claims.

## Ecosystem Coverage

| Metric | Count |
| --- | ---: |
| Networks | 2 (Ethereum (1), Unichain (130)) |
| Hooks analyzed | 880 |
| Pools indexed | 2,805 |
| Findings | 5,066 |
| Monitored hooks | 0 |
| Security events | 0 |

The finding count is larger than the Phase 2C observation-only total (4,232) because the risk-correlation layer was applied to the same 880 hooks.

## Risk Category Distribution

Counts are **unique hooks** with at least one finding in that taxonomy category, not raw finding rows.

| Category | Hooks affected |
| --- | ---: |
| FUND_SAFETY | 17 |
| SWAP_SECURITY | 0 |
| UPGRADE_SECURITY | 2 |
| ADMIN_CONTROL | 0 |
| ORACLE_SECURITY | 0 |
| EXTERNAL_EXECUTION | 815 |
| PERMISSION_SECURITY | 0 |

Zero is a research result. Correlation rules are conservative: a named/selector fee setter, oracle setter, or configuration mutator must be present **together** with the other required facts. Unverified bytecode often cannot satisfy that AND.

## Severity Distribution

Severity is potential impact. It does **not** represent confirmed exploitation.

| Severity | Findings | Unique hooks |
| --- | ---: | ---: |
| CRITICAL | 2 | 2 |
| HIGH | 15 | 15 |
| MEDIUM | 2 | 2 |
| LOW | 2,305 | 843 |

Most findings are low-severity observations (opcode presence, unnamed selectors, permission bits). The two critical findings are upgradeable swap-control correlations with an EOA upgrade path — still capabilities, not exploits.

## Confidence Distribution

Confidence measures evidence strength, not whether an attack occurred.

Landscape bands:

| Band | Meaning | Findings |
| --- | --- | ---: |
| CONFIRMED | Manual review marked the observation confirmed | 80 |
| STRONG | High-confidence evidence (slots, successful calls, named ABI) | 1,121 |
| OBSERVED | Medium/low confidence or incomplete naming | 3,865 |

`FALSE_POSITIVE` rows are excluded from these bands. None were recorded in the Phase 2C review set.

## Hook Capability Overview

Callback counts come from Uniswap v4 permission bits in the hook address. Upgradeable counts use EIP-1967 proxy facts. External execution counts hooks with CALL/DELEGATECALL observations or the correlated `EXTERNAL_EXECUTION` finding.

| Capability | Hooks |
| --- | ---: |
| beforeSwap | 789 |
| afterSwap | 335 |
| beforeAddLiquidity | 558 |
| afterAddLiquidity | 95 |
| Upgradeable (proxy) | 22 |
| Privileged admin controls | 260 |
| External execution capabilities | 815 |

A `beforeSwap` flag means `PoolManager` is permitted to call that callback. It is not a vulnerability by itself.

---

# Risk Categories

For every category: purpose, detection logic, why it matters, and limitations.

HookGuard findings represent **security-relevant capabilities and configurations**, not confirmed exploits.

## Fund safety (`FUND_SAFETY`)

**Purpose.** Identify hooks where privileged control exists together with token-transfer capability.

**Detection logic.** `transfer` / `transferFrom` / `safeTransfer` / `safeTransferFrom` (name or canonical selector) **and** an owner/admin/role/proxy-admin fact.

**Why it matters.** If those functions are reachable, an authorized account may move hook-controlled assets.

**Limitations.** Selector presence is not a CFG proof of reachability. Unnamed selectors stay low confidence. This is not evidence that funds were moved.

Live corpus: **17** hooks.

## Swap security (`SWAP_SECURITY`)

**Purpose.** Identify hooks where swap callbacks coexist with a privileged fee setter.

**Detection logic.** `beforeSwap` or `afterSwap` **and** a fee setter (`setFee` name or known fee-collection selector) **and** privileged control.

**Why it matters.** Trading economics (fees) may be modified by authorized parties.

**Limitations.** Fee-setter detection needs a named ABI item or a known selector. Unverified bytecode without that selector does not fire. Upgradeability of swap logic is a **different** category.

Live corpus: **0** hooks. That is expected with zero verified source and a strict AND.

## Upgrade security (`UPGRADE_SECURITY`)

**Purpose.** Identify hooks where privileged upgrade mechanisms can modify hook execution logic on the swap path.

**Detection logic.** EIP-1967 (or equivalent) proxy **and** a swap callback **and** upgrade authority (upgrade function or EOA proxy admin).

**Evidence typically includes:**

- proxy detection
- upgrade authority
- lifecycle callbacks (`beforeSwap` / `afterSwap`)

**Why it matters.** Whoever controls the upgrade can replace swap-callback behavior after LPs have joined the pool.

**Limitations.** Upgradeability alone is not a vulnerability. A proxy without swap callbacks, or without upgrade authority, does not emit this finding.

Live corpus: **2** hooks.

## Admin control (`ADMIN_CONTROL`)

**Purpose.** Identify privileged configuration control that is more than “an `owner()` exists.”

**Detection logic.** Owner/admin **and** named configuration mutators (not `owner()` alone; fee/oracle/upgrade setters are classified elsewhere).

**Why it matters.** Authorized accounts may change hook configuration after deployment.

**Limitations.** An EOA owner with **no** discovered mutators is recorded as an observation fact, not this taxonomy finding. Named mutators are rare without verified ABI.

Live corpus: **0** hooks.

## Oracle security (`ORACLE_SECURITY`)

**Purpose.** Identify privileged ability to change an oracle used with price-sensitive callbacks.

**Detection logic.** Oracle setter (`setOracle` or known oracle selector) **and** privileged control **and** `beforeSwap` / `afterSwap`.

**Why it matters.** Price-related behavior depends on privileged configuration.

**Limitations.** Without verified source or a matching selector, the rule does not fire. An oracle used off-chain is out of scope.

Live corpus: **0** hooks.

## External execution (`EXTERNAL_EXECUTION`)

**Purpose.** Identify hooks that both implement lifecycle callbacks and contain `CALL` or `DELEGATECALL` in runtime bytecode (or verified source that binds those calls to a callback).

**Detection logic.** At least one lifecycle callback **and** (`CALL` or `DELEGATECALL`).

**Why it matters.** The hook can execute external contract interactions. That is a large, normal surface on Uniswap v4 — and it is also how many real failures propagate.

**Limitations.** Opcode presence does **not** prove the call is reachable from `beforeSwap` / `afterSwap` unless verified source associates the call with that function. In this corpus that binding is unavailable, so confidence stays low / `OBSERVED`. This category is common (815 hooks) and is **not** a claim that 815 hooks are unsafe.

Live corpus: **815** hooks.

## Permission security (`PERMISSION_SECURITY`)

**Purpose.** Reserved for flag/callback mismatches (implemented callback not encoded in the hook address, or the reverse).

**Detection logic.** Comparison of hook-address permission bits with recovered ABI/source callbacks. Extra implemented callbacks are **not** auto-vulnerabilities: `PoolManager` will not call an un-flagged callback.

**Why it matters.** Address bits are the permission model LPs actually get.

**Limitations.** This category is **not** emitted as a “vuln” by itself. Observation rule `hooks-permission-compare` still runs (`UNKNOWN_SOURCE` when ABI is missing).

Live corpus: **0** correlated risk findings.

---

# How to read this report

1. Start with coverage: what was actually indexed.
2. Treat unique-hook category counts as **capability prevalence**, not exploit counts.
3. Read evidence JSON before interpreting any single hook.
4. Treat `NEEDS_CONTEXT` / `OBSERVED` as incomplete, not as confirmed issues.
5. Use [VALIDATION_REPORT.md](./VALIDATION_REPORT.md) for the 20-hook manual review.
6. Use [CASE_STUDIES.md](./CASE_STUDIES.md) for address-based examples.

Regenerate with `npm run report:risk`. Same database state produces the same metrics (generated timestamp is the only intentional change unless the caller supplies `generatedAt`).
