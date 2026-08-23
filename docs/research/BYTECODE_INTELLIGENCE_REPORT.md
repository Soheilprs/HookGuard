# Bytecode intelligence

Phase 7C adds **control-flow reachability** on Uniswap v4 hook runtime bytecode so HookGuard can still produce review-grade findings when verified source is missing.

Findings are **security-relevant execution patterns requiring review**, not confirmed exploits.

**HookGuard does not replace a professional smart-contract audit.**

Regenerate: `npm run analyze:bytecode`  
Machine output: [`reports/bytecode-analysis-results.md`](../../reports/bytecode-analysis-results.md)

---

## Why bytecode analysis matters

The Phase 7B corpus had **0 verified source** contracts. Opcode presence (`DELEGATECALL exists`) is too coarse: proxies, unused functions, and metadata all contain opcodes that `PoolManager` will never execute as a hook callback.

The question that matters for Uniswap v4 is:

> Can execution starting at a recovered `beforeSwap` / `afterSwap` / liquidity / donate entry reach CALL, DELEGATECALL, or SSTORE?

---

## Methodology

```
Disassemble (PUSH1–PUSH32, pc tracking)
        ↓
Lightweight CFG (JUMP / JUMPI / JUMPDEST, resolved dests only)
        ↓
Dispatcher recovery (PUSH4 + EQ + PUSH dest + JUMPI)
        ↓
Map selectors → IHooks callbacks (ABI names, selector database, address flags)
        ↓
BFS from callback entries
        ↓
Detectors (reachable DELEGATECALL / CALL / SSTORE / call-before-SSTORE)
```

Unresolved dynamic jumps are **not** followed. Counts are under-approximate (false negatives over false “reachable” claims).

Analysis type: `BYTECODE_CFG`.

---

## Limitations

- Not a full EVM interpreter. No memory model, no calldata, no symbolic execution of `JUMP` targets computed at runtime.
- Proxy bytecode is the hook address code, not necessarily the implementation.
- Dispatcher recovery assumes a Solidity-like PUSH4/EQ/JUMPI pattern.
- Function names are never invented; only known IHooks selectors are labeled.
- Reachable ≠ exploitable. SSTORE on a callback is often intended.

---

## Coverage (corpus run 2026-08-23T13:13:49.220Z)

880 hooks analyzed (Ethereum + Unichain). Verified source still 0.

| Metric | Count |
| --- | ---: |
| DELEGATECALL opcode present (Phase 7B-style) | **409** |
| DELEGATECALL reachable from a recovered callback (CFG) | **0** |
| CALL reachable from a callback | **39** |
| SSTORE reachable from a callback | **177** |
| CALL/DELEGATECALL before SSTORE on a callback path | **10** |

That 409 → 0 drop is the point: opcode presence is not callback reachability. The 0 is under-approximate (unresolved jumps are skipped), not a proof that no hook ever delegatecalls on the swap path.

SSTORE-on-callback (177) is often intended hook state. It is recorded as a pattern, not a vulnerability.

Examples (real addresses, BYTECODE_CFG, MEDIUM/LOW):

- CALL: `0x00bbc6fc07342cf80d14b60695cf0e1aa8de00cc` (`beforeSwap`, pc 3395)
- SSTORE: `0x000b70f7cd351f7479d1aa6f1354d32ed8821080` (`beforeSwap`, pc 11402)
- Call-before-SSTORE: `0x1e4eb8d32c762dcffef8211e4c01da77aa1190cc` (`beforeSwap`, pc 3678, LOW)

Machine output: `reports/bytecode-analysis-results.md`

---

## Detectors

| Id | Category | Meaning |
| --- | --- | --- |
| `CALLBACK_REACHABLE_DELEGATECALL` | EXTERNAL_EXECUTION | Callback path can `DELEGATECALL` |
| `CALLBACK_EXTERNAL_CALL` | EXTERNAL_EXECUTION | Callback path can `CALL` |
| `CALLBACK_STORAGE_MUTATION` | SWAP_SECURITY | Callback path can `SSTORE` (not a vulnerability) |
| `CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE` | SWAP_SECURITY | CALL/DELEGATECALL then later SSTORE on a path |
