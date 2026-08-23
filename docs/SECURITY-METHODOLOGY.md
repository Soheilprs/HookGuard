# Security methodology

HookGuard publishes **evidence-backed security intelligence** for deployed Uniswap v4 hooks.

HookGuard does not replace a professional smart-contract audit.

## Product

HookGuard is not primarily a hook registry, generic v4 analytics, a generic Solidity scanner, or an AI auditor. Those surfaces exist only to support evidence about **this** hook on **this** chain.

## Fact vs finding

| | Meaning |
| --- | --- |
| Fact | Observed on-chain or from verified metadata (storage word, `eth_call` result, ABI item, opcode at a program counter, hook-address flag bits). |
| Finding | A published rule applied to facts. It always has `ruleId`, severity, confidence, `detectionSource`, description, and evidence JSON. |

No finding is stored without evidence.

## Severity vs confidence

**Severity** is how serious the observation would be if taken in operational context (e.g. an EOA that can upgrade implementation).

**Confidence** is how directly the evidence supports the observation.

`HIGH` severity with `LOW` confidence is not the same as `HIGH` severity with `HIGH` confidence. Bytecode-only CALL is never described as “external call in the swap path.”

## Detection sources

| Source | Meaning |
| --- | --- |
| `EIP1967_STORAGE` | Implementation/admin slots |
| `ONCHAIN_CALL` | `owner()` / `admin()` |
| `ACCESS_CONTROL_ENUMERATION` | `getRoleMember` |
| `HOOK_ADDRESS_FLAGS` | Low 14 bits of the hook address |
| `VERIFIED_ABI` | Named functions from verified ABI |
| `VERIFIED_SOURCE` | Association from verified Solidity text |
| `BYTECODE_SELECTOR` | PUSH4 dispatcher selectors |
| `BYTECODE_OPCODE` | Opcode walk that skips PUSH immediates |

## Deterministic vs heuristic

- **Tier 1** — storage slots, flag bits, successful view calls.
- **Tier 2** — ABI names, correlated EOA + mutators.
- **Tier 3** — raw opcodes and unnamed selectors. The UI labels these LOW CONFIDENCE / bytecode heuristic.

## Known limitations

- Opcode findings do not prove control-flow reachability from `beforeSwap` / `afterSwap` unless verified source binds the call to that function.
- Unverified bytecode can omit names and hide behavior.
- Extra implemented callbacks that are **not** flagged on the hook address are not automatically vulnerabilities (PoolManager will not invoke them).
- An EOA owner without discovered privileged mutators is a fact, not “critical risk.”
- HookGuard does not produce a numerical hook risk score in this phase.

## What HookGuard does not guarantee

Absence of findings is not a clean audit. Confirmed findings are not an exploit proof. Always read the evidence.
