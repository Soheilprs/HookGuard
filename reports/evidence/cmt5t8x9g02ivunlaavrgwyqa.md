# Finding

This is a **security-relevant implementation pattern requiring review**. It is not a confirmed exploit, not an accusation, and not proof that user funds are at risk.

## Detector

DANGEROUS_DELEGATECALL

## Hook

`0x830fd7757efa82dd0f5d47a4c2a15291dbeb28c4`

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
    "beforeSwap",
    "afterSwap"
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

Finding id: `cmt5t8x9g02ivunlaavrgwyqa`

HookGuard does not replace a professional smart-contract audit.

