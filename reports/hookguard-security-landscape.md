# HookGuard security landscape

Generated at: 2026-08-23T12:16:51.621Z

HookGuard reports security-relevant capabilities and configurations. Findings are not confirmed exploits, not accusations of malice, and not a numerical risk score. HookGuard does not replace a professional smart-contract audit.

## Ecosystem Coverage

| Metric | Count |
| --- | ---: |
| Networks | 2 (Ethereum (1), Unichain (130)) |
| Hooks analyzed | 880 |
| Pools indexed | 2805 |
| Findings | 5066 |
| Monitored hooks | 0 |
| Security events | 0 |

## Risk Category Distribution

Counts are **unique hooks** with at least one finding in that taxonomy category, not raw finding rows.

| Category | Hooks affected |
| --- | ---: |
| FUND_SAFETY (Fund safety) | 17 |
| SWAP_SECURITY (Swap security) | 0 |
| UPGRADE_SECURITY (Upgrade security) | 2 |
| ADMIN_CONTROL (Admin control) | 0 |
| ORACLE_SECURITY (Oracle security) | 0 |
| EXTERNAL_EXECUTION (External execution) | 815 |
| PERMISSION_SECURITY (Permission security) | 0 |

## Severity Distribution

Severity is potential impact of the observed capability. It does **not** mean confirmed exploitation.

| Severity | Findings | Unique hooks |
| --- | ---: | ---: |
| CRITICAL | 2 | 2 |
| HIGH | 15 | 15 |
| MEDIUM | 2 | 2 |
| LOW | 2305 | 843 |

## Confidence Distribution

Confidence measures evidence strength, not whether an attack occurred.

| Band | Meaning | Findings |
| --- | --- | ---: |
| CONFIRMED | Manual review marked the observation confirmed | 80 |
| STRONG | High-confidence evidence (slots, successful calls, named ABI) | 1121 |
| OBSERVED | Medium/low confidence or incomplete naming | 3865 |

## Hook Capability Overview

Callback counts come from Uniswap v4 permission bits in the hook address. Upgradeable counts use EIP-1967 proxy facts. External execution counts hooks with CALL/DELEGATECALL observations or the correlated EXTERNAL_EXECUTION finding.

| Capability | Hooks |
| --- | ---: |
| beforeSwap | 789 |
| afterSwap | 335 |
| beforeAddLiquidity | 558 |
| afterAddLiquidity | 95 |
| Upgradeable (proxy) | 22 |
| Privileged admin controls | 260 |
| External execution capabilities | 815 |

## Evidence samples

### FUND_SAFETY

- Rule: `risk-privileged-asset-movement`
- Hook: `0x09017ceb0966692d7fe529c1fbed36b938232088` (chain 1)
- Title: Privileged control of token-transfer functions
- Impact: PRIVILEGED_TOKEN_MOVEMENT
- Evidence keys: controllers, eoaController, tokenMovers

### UPGRADE_SECURITY

- Rule: `risk-upgradeable-swap-control`
- Hook: `0x083b8e471227c65579d30fc6a923ea07eecbc080` (chain 1)
- Title: Swap-path hook logic is upgradeable
- Impact: SWAP_PATH_LOGIC_REPLACEABLE
- Evidence keys: adminAddress, eoaUpgradeController, implementationAddress, proxy, proxyKind, swapCallbacks, upgradeFunctions

### EXTERNAL_EXECUTION

- Rule: `risk-callback-external-execution`
- Hook: `0x0000000aa232009084bd71a5797d089aa4edfad4` (chain 1)
- Title: External CALL/DELEGATECALL present alongside hook callbacks
- Impact: CALLBACK_EXTERNAL_CALL
- Evidence keys: callPresent, delegatecallPresent, lifecycleCallbacks, reachableFromHookCallback, sourceLifecycleCalls

HookGuard does not replace a professional smart-contract audit.

