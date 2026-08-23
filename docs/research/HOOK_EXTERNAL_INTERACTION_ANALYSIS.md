# Hook external interaction analysis

Generated at: 2026-08-23T13:30:26.091Z

HookGuard reports security-relevant execution patterns requiring review. Target recovery is bytecode-CFG based and under-approximate. These are not confirmed exploits. HookGuard does not replace a professional smart-contract audit.

# Executive Summary

HookGuard analyzes how deployed Uniswap v4 hooks interact with external contracts during lifecycle execution.

It recovers CALL targets from bytecode (constant PUSH20, SLOAD, calldata) when a callback-reachable path exists, then classifies only with evidence. It does not claim exploits, malice, or that user funds are at risk.

**HookGuard does not replace a professional smart-contract audit.**

# Methodology

Bytecode
↓
CFG
↓
Callback reachability
↓
CALL target recovery
↓
Selector classification
↓
Security review signal

Target sources: CONSTANT, STORAGE, UNKNOWN. Classifications used only when evidence exists: KNOWN_PROTOCOL, TOKEN_CONTRACT, UNKNOWN_CONTRACT, USER_CONTROLLED, DYNAMIC.

# Findings

| Metric | Count |
| --- | ---: |
| Hooks analyzed | 880 |
| Callback external calls | 39 |
| ERC20 interactions | 19 |
| Unknown targets | 39 |
| User-controlled targets | 4 |
| Known protocols | 0 |

Machine output: `reports/hookguard-interaction-analysis.md`.

# Limitations

- Bytecode CFG does not follow unresolved dynamic jumps.
- PUSH4 before CALL is a heuristic selector; it may not be the calldata selector actually stored in memory.
- Storage-loaded addresses have no value unless the slot is a constant.
- Protocol names are assigned only from a curated address list. Unknown constants stay unclassified as protocols.
- No exploit claims.

Regenerate with `npm run analyze:interactions`.
