# Validation

Manual review of HookGuard findings on **real** Uniswap v4 deployments.

Grant-facing expansion: [research/VALIDATION_REPORT.md](./research/VALIDATION_REPORT.md). Landscape snapshot: [research/HOOKGUARD_SECURITY_REPORT.md](./research/HOOKGUARD_SECURITY_REPORT.md).

Dataset: `data/validation/dataset.json`

HookGuard does not replace a professional smart-contract audit. Validation improves trustworthiness of **existing** rules. It is not a count of “vulns found.”

HookGuard never auto-marks findings `CONFIRMED`. Reviews are applied with `npm run validate:apply`.

## Statuses

| Status | Meaning |
| --- | --- |
| `UNREVIEWED` | Default. Not in precision. |
| `CONFIRMED` | Evidence matches what a reviewer inspected. |
| `FALSE_POSITIVE` | The rule fired for a misleading reason. |
| `NEEDS_CONTEXT` | Evidence is real but insufficient to confirm or reject (typical for bytecode CALL). |

Precision = `confirmed / (confirmed + false positives)`. `NEEDS_CONTEXT` is excluded from the denominator on purpose.

## How to review

1. Index real PoolManager `Initialize` events (`npm run index:v4`).
2. Inspect contracts (`npm run inspect:contracts`).
3. Analyze (`npm run analyze:hooks`).
4. Open `/hooks/<address>?chainId=`.
5. For each finding, record a review object with `status` and `notes`.
6. Apply reviews; they never overwrite evidence, only validation fields.

## Selection

The ground-truth set prefers a mix of Ethereum / Unichain, verified / unverified, proxy / non-proxy, and different hook-address flag combinations. Hooks are taken from the indexed corpus, not invented for tests.

## Phase 2C corpus (real deployments)

Indexed from Uniswap v4 PoolManager `Initialize` events. Ethereum historical scan did not finish at chain tip because a public RPC handler crashed on a single noisy block (skipped, then resumed). Unichain used `INDEX_START_BLOCK_UNICHAIN=54723212`. Sourcify/Etherscan returned **zero** verified sources without API keys.

| Chain | Pools | Unique hooks | Inspected | Verified source |
| --- | ---: | ---: | ---: | ---: |
| Ethereum (`1`) | 2757 | 865 | 865 | 0 |
| Unichain (`130`) | 48 | 15 | 15 | 0 |
| **Total** | **2805** | **880** | **880** | **0** |

Findings generated: **4232** (Ethereum 4138, Unichain 94). All `hooks-permission-compare` classifications are `UNKNOWN_SOURCE` because no verified ABI was available.

Checkpoints at review time:

- Ethereum PoolManager `lastProcessedBlock` = `24296046`
- Unichain PoolManager `lastProcessedBlock` = `56724408`

## Phase 2C reviewed set

20 real hooks (12 Ethereum, 8 Unichain). Mix: 7 proxy, 13 non-proxy, 1 transparent-admin, 20 unverified. 135 findings reviewed.

Review policy (applied to produced evidence, never auto-confirmed by the engine):

- **CONFIRMED** — deterministic on-chain facts: hook-address flags, owner() results, EIP-1967 proxy-used / proxy-admin, UNKNOWN_SOURCE classification when source is missing.
- **NEEDS_CONTEXT** — bytecode CALL/DELEGATECALL/STATICCALL, unnamed privileged selectors, unnamed lifecycle selectors. Evidence is real; reachability or naming is not proven.
- **FALSE_POSITIVE** — none in this set. Opcode findings were **not** marked false positives merely because they are incomplete; they were marked `NEEDS_CONTEXT`.

Precision = confirmed / (confirmed + false positives). `NEEDS_CONTEXT` is excluded.

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

Overall decidable precision is 100% because reviewers refused to convert heuristics into confirmed vulnerabilities. That is not the same as “every rule is production-ready to show as HIGH confidence.”

## Rule tiers after validation

- **Tier 1** — `hooks-address-flags`, `proxy-used`, `proxy-admin`, `ownership-owner`, `ownership-access-control`. Deterministic when evidence slots/calls succeed.
- **Tier 2** — `ownership-owner-eoa` (fact unless correlated with mutators), `hooks-permission-compare` when ABI exists, named privileged functions.
- **Tier 3** — `ext-call`, `ext-delegatecall`, `ext-staticcall`, unnamed `privileged-functions`, unnamed `hooks-lifecycle`. Show as LOW CONFIDENCE / bytecode heuristic.

## Known validation gaps

- Zero verified-source hooks in the live corpus, so source/AST CALL association was unit-tested but not empirically measured on mainnet.
- Ethereum index is short of chain tip.
- Unichain window is recent history, not a full genesis scan.
- Extra implemented callbacks could not be classified as MATCH vs EXTRA on unverified bytecode.
