# HookGuard bytecode intelligence results

Generated at: 2026-08-23T13:13:49.220Z

HookGuard reports security-relevant execution patterns requiring review. CFG reachability is under-approximate (unresolved jumps are not followed). These are not confirmed exploits. HookGuard does not replace a professional smart-contract audit.

Findings are **security-relevant execution patterns requiring review**, not confirmed exploits.

## Coverage

| Metric | Count |
| --- | ---: |
| Hooks indexed | 880 |
| Hooks analyzed | 880 |
| DELEGATECALL opcode present (before) | 409 |
| DELEGATECALL reachable from a callback (after) | 0 |
| CALL reachable from a callback | 39 |
| SSTORE reachable from a callback | 177 |
| CALL/DELEGATECALL before SSTORE on a callback path | 10 |

Unresolved JUMP/JUMPI destinations are **not** followed. Reachable counts are therefore under-approximate.

## Detector results

| Detector | Hooks | Findings | HIGH | MEDIUM | LOW |
| --- | ---: | ---: | ---: | ---: | ---: |
| CALLBACK_REACHABLE_DELEGATECALL | 0 | 0 | 0 | 0 | 0 |
| CALLBACK_EXTERNAL_CALL | 39 | 39 | 0 | 39 | 0 |
| CALLBACK_STORAGE_MUTATION | 177 | 177 | 0 | 177 | 0 |
| CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE | 10 | 10 | 0 | 0 | 10 |

## Before vs after

Opcode-level DELEGATECALL observations: **409**.

Callback-reachable DELEGATECALL (CFG): **0**.

HookGuard does not replace a professional smart-contract audit.

