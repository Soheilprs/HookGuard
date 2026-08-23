# Validation report

Expanded from [docs/VALIDATION.md](../VALIDATION.md). This document is the grant-facing validation package for Phase 6.5B.

HookGuard does not replace a professional smart-contract audit. Validation improves trustworthiness of **existing** rules. It is not a count of vulnerabilities found.

The engine **never** auto-marks findings `CONFIRMED`. Reviews are applied with `npm run validate:apply` from `data/validation/dataset.json`.

---

## Headline numbers

| | |
| --- | ---: |
| Reviewed hooks | **20** |
| Reviewed findings | **135** |
| Confirmed observations | **80** |
| False positives | **0** |
| Needs context | **55** |

Some findings require human interpretation and are **not** automatically vulnerabilities.

Precision = `confirmed / (confirmed + false positives)` = `80 / (80 + 0)` = **100%** on **decidable** rows. `NEEDS_CONTEXT` is excluded from the denominator on purpose. Reviewers refused to convert bytecode heuristics into confirmed issues to improve the number.

That 100% is **not** “every rule is production-ready to display as HIGH confidence.”

---

## What was reviewed

Phase 2C ground truth on **real** Uniswap v4 deployments (not fixtures):

- 20 hooks: 12 Ethereum, 8 Unichain
- Mix: 7 proxy, 13 non-proxy, 1 transparent-admin, 20 unverified
- 135 findings from observation rules (flags, proxy, ownership, lifecycle selectors, opcodes, privileged selectors)

Dataset: `data/validation/dataset.json`.

Selection prefers a mix of chains, proxy / non-proxy, and hook-address flag combinations. Hooks come from the indexed corpus.

---

## Status meanings

| Status | Meaning |
| --- | --- |
| `UNREVIEWED` | Default. Not in precision. |
| `CONFIRMED` | Evidence matches what a reviewer inspected. |
| `FALSE_POSITIVE` | The rule fired for a misleading reason. |
| `NEEDS_CONTEXT` | Evidence is real but insufficient to confirm or reject (typical for bytecode `CALL`). |

Review policy applied to produced evidence:

- **CONFIRMED** — deterministic on-chain facts: hook-address flags, `owner()` results, EIP-1967 `proxy-used` / `proxy-admin`, `UNKNOWN_SOURCE` classification when source is missing.
- **NEEDS_CONTEXT** — bytecode `CALL` / `DELEGATECALL` / `STATICCALL`, unnamed privileged selectors, unnamed lifecycle selectors. Evidence is real; reachability or naming is not proven.
- **FALSE_POSITIVE** — none in this set. Opcode findings were **not** marked false positives merely because they are incomplete.

---

## Per-rule review

| Rule | Reviewed | Confirmed | False positive | Needs context | Precision |
| --- | ---: | ---: | ---: | ---: | ---: |
| hooks-address-flags | 20 | 20 | 0 | 0 | 100% |
| hooks-permission-compare | 20 | 20 | 0 | 0 | 100% |
| ownership-owner | 18 | 18 | 0 | 0 | 100% |
| ownership-owner-eoa | 13 | 13 | 0 | 0 | 100% |
| proxy-used | 7 | 7 | 0 | 0 | 100% |
| proxy-admin | 1 | 1 | 0 | 0 | 100% |
| ownership-access-control | 1 | 1 | 0 | 0 | 100% |
| hooks-lifecycle | 13 | 0 | 0 | 13 | n/a |
| ext-delegatecall | 12 | 0 | 0 | 12 | n/a |
| ext-call | 11 | 0 | 0 | 11 | n/a |
| ext-staticcall | 10 | 0 | 0 | 10 | n/a |
| privileged-functions | 9 | 0 | 0 | 9 | n/a |
| **All reviewed** | **135** | **80** | **0** | **55** | **100%** |

---

## Rule tiers after validation

- **Tier 1** — `hooks-address-flags`, `proxy-used`, `proxy-admin`, `ownership-owner`, `ownership-access-control`. Deterministic when evidence slots/calls succeed.
- **Tier 2** — `ownership-owner-eoa` (fact unless correlated with mutators), `hooks-permission-compare` when ABI exists, named privileged functions, AND-correlated risk rules when named evidence is present.
- **Tier 3** — `ext-call`, `ext-delegatecall`, `ext-staticcall`, unnamed `privileged-functions`, unnamed `hooks-lifecycle`, `EXTERNAL_EXECUTION` without source binding.

---

## Landscape confidence bands (full corpus)

The Phase 6.5B landscape report maps **all** 5,066 findings (not only the 135 reviewed) into evidence-strength bands:

| Band | Mapping | Findings in snapshot |
| --- | --- | ---: |
| CONFIRMED | `validationStatus = CONFIRMED` | 80 |
| STRONG | unreviewed/other with `confidence = HIGH` | 1,121 |
| OBSERVED | `MEDIUM` / `LOW` (and not false positive) | 3,865 |

The 80 `CONFIRMED` landscape rows **are** the 80 Phase 2C confirmed observations. Risk-taxonomy findings added after that review remain `UNREVIEWED` unless a later `validate:apply` covers them.

That is correct behavior: correlation does not auto-confirm.

---

## Risk-taxonomy findings are not a second “vuln count”

Phase 6.5A/6.5B added AND-correlated categories (`FUND_SAFETY`, `UPGRADE_SECURITY`, …). Those findings:

- reuse the same evidence fields (`category`, `impact`, `affectedComponent`, `severity`, `confidence`, `evidence`)
- still require non-empty evidence
- are **not** included in the 135-finding reviewed table above

Interpretation:

| Human question | Honest answer |
| --- | --- |
| Did the opcode exist? | Often yes (`NEEDS_CONTEXT` / `OBSERVED`). |
| Is it reachable from `beforeSwap`? | Not proven without verified source. |
| Is the hook malicious? | HookGuard does not claim that. |
| Should an LP treat this as an audit? | No. |

**Some findings require human interpretation and are not automatically vulnerabilities.**

---

## Corpus at review time (and now)

Indexed from Uniswap v4 PoolManager `Initialize` events. Ethereum historical scan did not finish at chain tip (public RPC skipped a noisy block). Unichain used `INDEX_START_BLOCK_UNICHAIN=54723212`. Sourcify/Etherscan returned **zero** verified sources without API keys.

| Chain | Pools | Unique hooks | Inspected | Verified source |
| --- | ---: | ---: | ---: | ---: |
| Ethereum (`1`) | 2,757 | 865 | 865 | 0 |
| Unichain (`130`) | 48 | 15 | 15 | 0 |
| **Total** | **2,805** | **880** | **880** | **0** |

Phase 2C observation findings: **4,232**.  
After risk-correlation re-analyze (Phase 6.5B snapshot): **5,066**. Same 880 hooks.

Checkpoints at original review:

- Ethereum PoolManager `lastProcessedBlock` = `24296046`
- Unichain PoolManager `lastProcessedBlock` = `56724408`

---

## Known validation gaps

- Zero verified-source hooks, so source/AST CALL association was unit-tested but not empirically measured on mainnet.
- Ethereum index is short of chain tip.
- Unichain window is recent history, not a full genesis scan.
- Extra implemented callbacks could not be classified as MATCH vs EXTRA on unverified bytecode.
- Risk-taxonomy rows (`risk-*` rules) have not been through a dedicated 20-hook review pass. Their evidence is still required and inspectable.
- Monitoring was not part of the validation sample (`monitoredHooks = 0` in the landscape snapshot).

---

## How to extend the sample

1. Index real `Initialize` events (`npm run index:v4`).
2. Inspect (`npm run inspect:contracts`).
3. Analyze (`npm run analyze:hooks`).
4. Open `/hooks/<address>?chainId=`.
5. Record reviews with `status` and `notes`.
6. Apply; reviews never overwrite evidence.

Regenerate landscape metrics with `npm run report:risk`.
