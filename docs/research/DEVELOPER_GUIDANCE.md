# Developer guidance

Deployment checklist for authors of Uniswap v4 hooks.

HookGuard inspects **deployed** bytecode the way an outsider does. Use this list before you ship, then compare the public page for your hook against what you intended.

**HookGuard does not replace a professional smart-contract audit.** Passing this checklist is not a safety proof.

---

## Access control

- [ ] Every privileged path (`owner`, `admin`, roles, proxy admin) is documented.
- [ ] Production controllers are a multisig or timelock if humans can change behavior after LPs join.
- [ ] An EOA owner with **no** mutators is still a fact outsiders will see — do not leave `owner()` pointing at a throwaway key if you later add setters.
- [ ] `transferOwnership` / `grantRole` paths are intentional and tested.

HookGuard: `ownership-owner`, `ownership-owner-eoa`, `ADMIN_CONTROL` (named mutators + controller).

## Upgradeability

- [ ] If the hook is a proxy, the implementation slot and admin are public and match what you tell users.
- [ ] If swap callbacks are enabled, assume upgrade = **replaceable swap-path logic**.
- [ ] Prefer immutable implementations, or a timelocked admin, when LPs cannot exit faster than an upgrade.
- [ ] Do not treat “it is a proxy” as hidden — EIP-1967 is the first thing HookGuard reads.

HookGuard: `proxy-used`, `proxy-admin`, `UPGRADE_SECURITY` (proxy **and** swap callback **and** upgrade authority).

## Swap callbacks

- [ ] Permission bits in the hook address match the callbacks you actually want `PoolManager` to invoke.
- [ ] Extra Solidity functions that are **not** flagged will not be called by `PoolManager`; do not market them as live hooks.
- [ ] `beforeSwap` / `afterSwap` plus a fee setter plus an admin is a fee-control capability. Document who can change fees.

HookGuard: `hooks-address-flags`, `hooks-permission-compare`, `SWAP_SECURITY`.

## External calls

- [ ] Know every `CALL` / `DELEGATECALL` in runtime bytecode, not only in your favorite Solidity function.
- [ ] If a call must sit on `beforeSwap` or `afterSwap`, keep verified source public so reviewers can bind it.
- [ ] `DELEGATECALL` into user-controlled or upgradeable targets needs a dedicated review.
- [ ] Opcode presence without source is a **heuristic**. Do not be surprised when HookGuard marks it `OBSERVED` / `NEEDS_CONTEXT`.

HookGuard: `ext-call`, `ext-delegatecall`, `EXTERNAL_EXECUTION`.

## Oracle configuration

- [ ] If the hook reads a price on the swap path, the oracle address and updater are documented.
- [ ] `setOracle` (or equivalent) is restricted; changing it changes swap-path behavior without changing the hook address.
- [ ] Do not rely on an off-chain UI feed as if it were the on-chain oracle.

HookGuard: `ORACLE_SECURITY` (setter **and** privileged control **and** price-sensitive callback).

## Privileged functions

- [ ] Inventory setters: fee, oracle, pause, hook address, upgrades, ownership.
- [ ] Unverified bytecode will show **selectors**, not names. Publish ABI/source if you want HIGH confidence naming.
- [ ] Token `transfer` / `transferFrom` in a hook that can hold assets is a fund-safety capability when an admin exists — document custody.
- [ ] Do not add admin setters “just in case” if you intend the hook to be immutable.

HookGuard: `privileged-functions`, `FUND_SAFETY`, `ADMIN_CONTROL`.

---

## After deployment

1. Index the hook (PoolManager `Initialize`) and open `/public/hooks/<address>`.
2. Read **Finding → Impact → Evidence → Recommended review**.
3. If a finding is a capability you intended, say so in your own docs. If it is not, fix the contract — do not ask HookGuard to hide evidence.
4. Watch implementation, admin, owner, and bytecode if any of those can still change.

Guidance in the API (`guidance`, `reviewQuestions`) is the same playbook, attached at read time. It does not invent observations.
