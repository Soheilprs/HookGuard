# Finding

This is a **security-relevant implementation pattern requiring review**. It is not a confirmed exploit, not an accusation, and not proof that user funds are at risk.

## Detector

DANGEROUS_DELEGATECALL

## Hook

`0x13f627635cd96a2a75c2efbdba979172cab2e888`

## Network

Ethereum (1)

## Severity

LOW

## Confidence

LOW (evidence strength, not confirmed exploitation)

## Affected function

beforeAddLiquidity

## Source location

Unavailable (no verified source span).

## Source code snippet

Unavailable. This finding used bytecode or ABI facts. It does not include a Solidity span.

## Bytecode / structured evidence

```json
{
  "opcode": "DELEGATECALL",
  "lifecycleCallbacks": [
    "beforeAddLiquidity",
    "beforeSwap"
  ],
  "reachableFromHookCallback": false
}
```

## Why it matters

delegatecall is present in a hook lifecycle function (or on a hook with those callbacks, bytecode-only). delegatecall in a hook lifecycle function runs arbitrary code against hook storage. Bytecode-only hits are not proven to sit in the callback. HookGuard does not replace a professional smart-contract audit.

## Recommended review action

- [ ] Is delegatecall source-bound to a listed callback?
- [ ] Who controls the target?
- [ ] If this is bytecode-only, can verified source rule it out?

## Analysis type

BYTECODE

Finding id: `cmt5t93yh07kpunlak4mvqcpf`

HookGuard does not replace a professional smart-contract audit.

