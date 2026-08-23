# Hook security analysis

Phase 7A adds a **Uniswap v4 hook-specific** analyzer. It is not a generic Solidity scanner, not an AI auditor, and not a scoring product.

Findings are **security-relevant capabilities and configurations**. They are not confirmed exploits, not accusations of malice, and not a numerical risk score.

**HookGuard does not replace a professional smart-contract audit.**

Location: `packages/blockchain/src/analyzer/`.

---

## Methodology

```
Verified Solidity source (when available)
        ↓
Function parser (callbacks, modifiers, bodies, line spans)
        ↓
Hook-path detectors (lifecycle callbacks only, except access-control names)
        ↓
Bytecode fallback (only where the pattern can be stated honestly)
        ↓
Evidence (function name, location, snippet, analysisType)
```

Source is preferred. Bytecode cannot prove that an opcode sits inside `beforeSwap`. When source is missing, most detectors stay silent rather than invent a callback binding.

Every analyzer finding includes:

| Field | Meaning |
| --- | --- |
| `functionName` | Lifecycle or sensitive function the detector bound |
| `sourceLocation` | `Lstart-Lend` in flattened verified source, if parsed |
| `codeSnippet` | Function source span, if parsed |
| `analysisType` | `SOURCE`, `BYTECODE`, or `HYBRID` |

Evidence JSON is still mandatory. Empty evidence is dropped.

---

## Supported detectors

### 1. `CALLBACK_REENTRANCY_RISK`

**Detects:** a listed lifecycle callback (`beforeSwap`, `afterSwap`, `beforeAddLiquidity`, `afterAddLiquidity`, `beforeRemoveLiquidity`, `afterRemoveLiquidity`) that performs an external `.call` **and** a later state update.

**Why it is hook-specific:** the window is on the Uniswap v4 pool callback path, not an arbitrary public function.

**Requires source.** Ordering is not proven from bytecode.

### 2. `MISSING_ACCESS_CONTROL`

**Detects:** these sensitive functions with no observed `onlyOwner`, AccessControl/role, or `msg.sender` owner check:

`setFee`, `setOracle`, `setHook`, `withdraw`, `rescueTokens`, `upgradeTo`, `upgradeToAndCall`, `pause`

**Requires source.** ABI names without a body are not enough to claim a missing guard.

### 3. `UNRESTRICTED_EXTERNAL_EXECUTION`

**Detects:** a listed lifecycle callback that `.call`/`.delegatecall`s a **parameter**, `msg.sender`, or similarly unrestricted target.

A `CONSTANT` / hardcoded `address(0x…)` / `address(this)` target is not this finding.

**Requires source.**

### 4. `DANGEROUS_DELEGATECALL`

**Detects:** `delegatecall` **inside** a listed lifecycle function (source).

**Bytecode fallback:** `DELEGATECALL` opcode **and** listed lifecycle flags or names, with `reachableFromHookCallback: false` and LOW confidence. That fallback does **not** claim the opcode is inside `beforeSwap`.

### 5. `CUSTOM_ACCOUNTING_REVIEW`

**Detects:** `beforeSwap` / `afterSwap` using Uniswap v4 custom accounting (`BeforeSwapDelta` / `AfterSwapDelta`) or a `hookData` `abi.decode` that can influence the returned delta, without an observed validation.

Zero-delta returns are not flagged. Custom accounting is a v4 feature; this is a review pattern.

**Requires source.**

### 6. `HOOK_PERMISSION_MISMATCH`

**Detects:** implemented callbacks vs hook-address permission bits (extra or missing). Extra unflagged functions are **not** called by `PoolManager`.

Uses source function names when present, otherwise named ABI.

---

## What this analyzer does not do

- Generic reentrancy on `withdraw` or other non-callback functions
- Compiler warnings, floating pragmas, integer overflow, `tx.origin`
- AI-written findings
- Numerical scores
- Confirmed exploit claims

Observation rules from earlier phases (`ext-call`, `hooks-permission-compare`, risk correlations) still run. The analyzer adds a source-bound hook-path layer.

---

## Limitations

- The parser is regex/brace based, not `solc`. Unusual macros or assembly can hide bodies.
- Flattened JSON sources concatenate files; line numbers are in that flattened text.
- `onlyPoolManager` on a callback is the Uniswap v4 invocation guard, not an admin check for `setFee`.
- Bytecode `DELEGATECALL` + flags is a review signal, not “delegatecall in beforeSwap.”
- Absence of a detector hit is not safety.

Synthetic fixtures used in tests: `packages/blockchain/src/analyzer/fixtures/UnsafeHook.sol`, `SafeHook.sol`. They are **not** the Phase 7B corpus.

Real-world output: [`reports/hookguard-security-analysis-results.md`](../../reports/hookguard-security-analysis-results.md), JSON companion, and [`reports/evidence/`](../../reports/evidence/). Interpretation: [REAL_WORLD_HOOK_ANALYSIS.md](./REAL_WORLD_HOOK_ANALYSIS.md). Bytecode CFG: [BYTECODE_INTELLIGENCE_REPORT.md](./BYTECODE_INTELLIGENCE_REPORT.md). Interactions: [HOOK_EXTERNAL_INTERACTION_ANALYSIS.md](./HOOK_EXTERNAL_INTERACTION_ANALYSIS.md).
