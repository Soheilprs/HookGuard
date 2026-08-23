# Security methodology

HookGuard publishes **evidence-backed security intelligence** for deployed Uniswap v4 hooks.

**HookGuard does not replace a professional smart-contract audit.**

It is not a generic scanner, not an AI auditor, and not a risk-scoring product. Those surfaces, when they exist in the UI, only exist to show evidence about **this** hook on **this** chain.

## Fact vs finding

| | Meaning |
| --- | --- |
| **Fact** | Observed on-chain or from verified metadata: a storage word, `eth_call` result, ABI item, opcode at a program counter, hook-address flag bits. |
| **Finding** | A published rule applied to facts. Always has `ruleId`, severity, confidence, `detectionSource`, description, and evidence JSON. |

No finding is stored without evidence. The UI must not invent observations.

## Severity vs confidence

**Severity** is how serious the observation would be *if* the evidence is interpreted in operational context (for example an EOA that can call `upgradeTo`).

**Confidence** is how directly the evidence supports that observation.

They are independent:

- HIGH severity / HIGH confidence ≠ HIGH severity / LOW confidence
- Bytecode-only `CALL` is **never** described as “external call in the swap path”

Allowed confidence values: `HIGH`, `MEDIUM`, `LOW`.

## Detection sources

Every finding records how it was derived. Heuristic origin is not hidden.

| Source | Meaning |
| --- | --- |
| `EIP1967_STORAGE` | Implementation / admin slots |
| `ONCHAIN_CALL` | `owner()` / `admin()` |
| `ACCESS_CONTROL_ENUMERATION` | `getRoleMember` |
| `HOOK_ADDRESS_FLAGS` | Low 14 bits of the hook address |
| `VERIFIED_ABI` | Named functions from verified ABI |
| `VERIFIED_SOURCE` | Association from verified Solidity text |
| `BYTECODE_SELECTOR` | PUSH4 dispatcher selectors |
| `BYTECODE_OPCODE` | Opcode walk that skips PUSH immediates |

## Deterministic vs heuristic

| Tier | Kind | Examples | UI |
| --- | --- | --- | --- |
| 1 | Deterministic | EIP-1967 slots, hook-address flags, successful `owner()` | Solid card, high confidence when the slot/call succeeded |
| 2 | Contextual | EOA owner *with* discovered mutators; named privileged setters | Needs the correlation, not the EOA alone |
| 3 | Heuristic | Raw CALL/DELEGATECALL/STATICCALL; unnamed selectors | Dashed card, **LOW CONFIDENCE**, “Bytecode heuristic” |

An EOA owner with **no** discovered privileged mutators is recorded as a fact (lower severity), not “critical risk.”

An extra implemented callback that is **not** flagged on the hook address is **not** automatically a vulnerability: `PoolManager` will not call it.

UUPS is **not** claimed merely because an implementation slot is set.

## Validation process

1. Index real PoolManager `Initialize` events.
2. Inspect and analyze.
3. Select a mix of real hooks (see [VALIDATION.md](./VALIDATION.md)).
4. Review each finding: `CONFIRMED`, `FALSE_POSITIVE`, or `NEEDS_CONTEXT`.
5. Apply with `npm run validate:apply`. The engine **never** auto-marks `CONFIRMED`.

Precision = `confirmed / (confirmed + false positives)`. `NEEDS_CONTEXT` is excluded on purpose. Reviewers must not convert heuristics into confirmed vulns to improve the number.

Phase 2C reviewed **20** real hooks and **135** findings: 80 confirmed, 0 false positive, 55 needs context. Expanded write-up: [research/VALIDATION_REPORT.md](./research/VALIDATION_REPORT.md). Landscape metrics: [research/HOOKGUARD_SECURITY_REPORT.md](./research/HOOKGUARD_SECURITY_REPORT.md). Review guidance: [research/SECURITY_PLAYBOOK.md](./research/SECURITY_PLAYBOOK.md).

## Limitations

- Opcode findings do not prove reachability from `beforeSwap` / `afterSwap` unless verified source binds the call to that function.
- Unverified bytecode can omit names and hide behavior.
- Verified source improves confidence; it does not prove safety. The Phase 2C corpus had **zero** verified-source hooks without explorer API keys.
- Absence of findings is not a clean bill of health.
- Confirmed findings are not exploit proofs. Always read the evidence.
- HookGuard does not produce a numerical hook risk score. Capability correlations (proxy + swap callback + upgrade authority, and similar) are documented in [RISK-FRAMEWORK.md](./RISK-FRAMEWORK.md).

## What HookGuard does not guarantee

HookGuard does not replace a professional smart-contract audit.

It does not guarantee that a hook is safe, that a finding is exploitable, or that an empty list means the contract was fully understood.
