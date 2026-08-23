# Real-world hook analysis (Phase 7B)

Snapshot: **2026-08-23T12:56:04.061Z** from `npm run analyze:hooks:research` against the indexed PostgreSQL corpus. No synthetic fixtures.

Machine output: [`reports/hookguard-security-analysis-results.md`](../../reports/hookguard-security-analysis-results.md) and [`reports/evidence/`](../../reports/evidence/) (409 write-ups).

Findings are **security-relevant implementation patterns requiring review**. They are not confirmed exploits, not accusations, and not proof that user funds are at risk.

**HookGuard does not replace a professional smart-contract audit.**

---

## Are the findings interesting?

Yes — but not as a list of “bugs found.”

The Phase 7A analyzer is source-first. This corpus has **zero verified Solidity**. Four of six detectors therefore correctly emitted **zero** findings instead of inventing callback bindings. That refusal is the main scientific result.

The fifth detector that can run on bytecode, `DANGEROUS_DELEGATECALL`, fired on **409 of 880** hooks (LOW confidence): DELEGATECALL exists in runtime bytecode **and** the hook has listed lifecycle callbacks. `reachableFromHookCallback` is **false** on every row. That is a review queue, not 409 incidents.

`HOOK_PERMISSION_MISMATCH` stayed at zero because this inspect run recovered almost no named ABI (no explorer keys). Extra vs missing callbacks cannot be classified honestly without source or names.

Would Uniswap Foundation care?

- **Yes:** nearly half of indexed v4 hooks combine a swap/liquidity callback permission with a DELEGATECALL opcode. That is a real ecosystem surface.
- **Yes:** unverified bytecode is the binding constraint on hook security research. Archive RPC + explorer API keys are the next measurement, not more detectors.
- **No, if the ask is “show us exploits.”** This package does not claim any.

Would developers find it useful?

- **Yes:** each evidence file is an address + detector + bytecode facts + review checklist.
- **Limited:** without source they cannot see whether DELEGATECALL sits in `beforeSwap`. The files say so.

---

## Coverage

| Metric | Count |
| --- | ---: |
| Networks | Ethereum (1), Unichain (130) |
| Hooks indexed | 880 |
| Hooks with verified source | 0 |
| Hooks analyzed | 880 |
| Source analysis count | 0 |
| Bytecode analysis count | 880 |
| Analyzer findings | 409 |

Ethereum 865 hooks / Unichain 15 hooks (same Phase 2C corpus).

---

## Detector results

| Detector | Hooks affected | Findings | HIGH | MEDIUM | LOW |
| --- | ---: | ---: | ---: | ---: | ---: |
| CALLBACK_REENTRANCY_RISK | 0 | 0 | 0 | 0 | 0 |
| MISSING_ACCESS_CONTROL | 0 | 0 | 0 | 0 | 0 |
| UNRESTRICTED_EXTERNAL_EXECUTION | 0 | 0 | 0 | 0 | 0 |
| DANGEROUS_DELEGATECALL | 409 | 409 | 0 | 0 | 409 |
| CUSTOM_ACCOUNTING_REVIEW | 0 | 0 | 0 | 0 | 0 |
| HOOK_PERMISSION_MISMATCH | 0 | 0 | 0 | 0 | 0 |

409 findings: Ethereum 402, Unichain 7 (all `DANGEROUS_DELEGATECALL`, BYTECODE, LOW).

Zeros mean the AND did not complete — usually “no verified source,” not “the pattern does not exist on mainnet.”

---

## Example evidence (real address)

Detector: `DANGEROUS_DELEGATECALL`  
Hook: `0x00001cd60b57fb77687985353645fb65554d0040` (Ethereum)  
Function name bound from lifecycle flags/ABI names: `afterSwap`  
Source snippet: unavailable  
Bytecode evidence: opcode `DELEGATECALL`, `reachableFromHookCallback: false`  
File: `reports/evidence/cmt5t93at074tunlawpgtyqdt.md`

Review: obtain verified source and check whether delegatecall is actually inside a callback. Do not treat this row as a confirmed issue.

---

## What to do next (not claimed as done)

1. Explorer API keys so verified-source rates are measurable and source-bound detectors can run.
2. Re-run `npm run analyze:hooks:research`.
3. Manual review of a sample of the 409 DELEGATECALL hooks once source exists.

Do not convert these 409 rows into a vulnerability count.
