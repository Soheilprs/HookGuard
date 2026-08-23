# Security intelligence playbook

How to read HookGuard findings as **review guidance**, not as a verdict.

Findings represent **security-relevant capabilities and configurations**. They are not confirmed issues, not accusations of malice, and not a numerical score.

**HookGuard does not replace a professional smart-contract audit.**

This playbook covers the risk taxonomy. Observation rules (`proxy-used`, `ownership-owner`, opcode `CALL`, …) still run; map them to the closest category below. Evidence JSON remains mandatory — guidance never substitutes for it.

Companion docs: [DEVELOPER_GUIDANCE.md](./DEVELOPER_GUIDANCE.md), [RISK_REVIEW_CHECKLIST.md](./RISK_REVIEW_CHECKLIST.md), [RISK-FRAMEWORK.md](../RISK-FRAMEWORK.md).

---

## FUND_SAFETY

### What HookGuard detects

Privileged control (owner, admin, role, or proxy admin) **and** token-transfer capability (`transfer` / `transferFrom` / safe variants by name or canonical selector).

### Why it matters

If those functions are reachable, an authorized account may move tokens the hook can touch. That is a fund-safety **configuration**, not proof that funds moved.

### Evidence examples

- `tokenMovers`: name and/or selector (`0xa9059cbb`, `0x23b872dd`, …)
- `controllers`: type, address, source (`owner()`, role, proxy admin)
- `eoaController`: whether a controller has empty bytecode

### Recommended review steps

1. Confirm the mover selectors against bytecode or verified ABI.
2. Identify the controller and whether it is an EOA, multisig, or timelock.
3. Ask whether the hook is expected to hold or move tokens.
4. Do not treat selector presence as a control-flow proof of reachability.

### Limitations

Selector presence is not a CFG proof. Unnamed selectors stay low confidence. This finding does not say that tokens were transferred.

---

## SWAP_SECURITY

### What HookGuard detects

`beforeSwap` and/or `afterSwap` **and** a fee setter (`setFee` or a known fee-collection selector) **and** privileged control.

### Why it matters

An authorized party may change swap fees while the hook still runs on the swap path. Trading economics can change after LPs join.

### Evidence examples

- `swapCallbacks`: `beforeSwap` / `afterSwap`
- `feeSetters`: name and selector
- `controllers` and `eoaController`

### Recommended review steps

1. Confirm the fee setter is named or matches a known selector.
2. Confirm a swap callback is encoded or implemented.
3. Review who can call the setter and whether a timelock applies.
4. Absence of this finding does not mean fees cannot change some other way.

### Limitations

Unverified bytecode without the known `setFee` selector will not fire. Upgradeability of swap logic is `UPGRADE_SECURITY`, not this category.

---

## UPGRADE_SECURITY

### What HookGuard detects

A proxy (typically EIP-1967) **and** a swap callback **and** an upgrade authority (upgrade function and/or EOA proxy admin).

### Why it matters

Whoever can upgrade the implementation can replace swap-callback behavior after pools are live. LPs are not guaranteed the bytecode they first inspected.

### Evidence examples

- `proxy` / `proxyKind`
- `implementationAddress`, `adminAddress`
- `swapCallbacks`
- `upgradeFunctions` (name or selector such as `0x3659cfe6`)
- `eoaUpgradeController`

### Recommended review steps

1. Verify the implementation slot on-chain matches the evidence.
2. Identify the upgrade admin and whether it is an EOA.
3. Confirm a swap callback is flagged or implemented.
4. Treat a proxy without swap-path control as a weaker observation, not this finding.

### Limitations

A proxy is not by itself a problem. Missing any of the three facts means this category does not fire. An upgrade selector is not proof an upgrade occurred.

---

## ADMIN_CONTROL

### What HookGuard detects

Owner/admin **and** named configuration mutators (pause, ownership transfer, hook-address setters, and similar). `owner()` alone is not enough.

### Why it matters

Authorized accounts may change hook configuration after deployment. That is operational control, not automatically a critical issue.

### Evidence examples

- `controllers`: type, address, source
- `adminMutators`: named functions
- `eoaController`

### Recommended review steps

1. List the named mutators in the evidence — unnamed selectors are not this finding.
2. Identify the controller and its operational controls (multisig, timelock).
3. Separate this from fee, oracle, and upgrade categories.

### Limitations

An EOA owner with no discovered mutators is an observation fact, not this taxonomy finding. Named mutators are rare without verified ABI.

---

## ORACLE_SECURITY

### What HookGuard detects

An oracle setter (`setOracle` or a known oracle selector) **and** privileged control **and** a price-sensitive callback (`beforeSwap` / `afterSwap`).

### Why it matters

Price-related hook behavior can change if an authorized account points the hook at a different oracle, without changing the hook address.

### Evidence examples

- `oracleSetters`: name and selector
- `priceSensitiveCallbacks`
- `controllers` and `eoaController`

### Recommended review steps

1. Confirm the setter is `setOracle` or a known oracle selector.
2. Confirm swap-path callbacks are present.
3. Review who can change the oracle and what it returns.
4. Do not treat an off-chain UI price as this finding.

### Limitations

Without verified source or the known selector, the rule does not fire. HookGuard does not simulate oracle manipulation.

---

## EXTERNAL_EXECUTION

### What HookGuard detects

At least one lifecycle callback **and** `CALL` and/or `DELEGATECALL` in runtime bytecode, or verified source that binds those calls to a callback.

### Why it matters

The hook can perform external contract interactions. That is common on Uniswap v4, and also how callback-time token, router, or oracle calls happen.

### Evidence examples

- `lifecycleCallbacks`
- `callPresent` / `delegatecallPresent`
- `sourceLifecycleCalls` (empty unless verified source binds the call)
- `reachableFromHookCallback` (true only with source binding)

### Recommended review steps

1. Read `reachableFromHookCallback`. If false, do not describe this as “external call in beforeSwap”.
2. Note whether CALL, DELEGATECALL, or both are present.
3. Prefer verified source before treating opcode presence as swap-path behavior.
4. Expect this category to be common; prevalence is not an incident count.

### Limitations

Opcode presence is not a control-flow graph. Without verified source, HookGuard does not claim the call sits on `beforeSwap` or `afterSwap`.

---

## Permission bits (reserved)

`PERMISSION_SECURITY` is reserved for hook-address flag comparison. Extra implemented-but-unflagged callbacks are **not** automatically invoked by `PoolManager`. Observation rule `hooks-permission-compare` still runs (`UNKNOWN_SOURCE` without ABI). This playbook does not treat that observation as a default issue.

---

## How the product uses this playbook

The API attaches `guidance`, `reviewQuestions`, and `impactExplanation` when serializing findings. Those fields are **derived** from `category` and `impact` at read time. They are not stored as a score and they do not create new detection rules. Empty evidence still means the finding is invalid — guidance cannot fill that gap.
