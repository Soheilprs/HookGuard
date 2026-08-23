# Hook interaction case studies

Generated at: 2026-08-23T13:30:26.091Z

Automatically selected from recovered callback CALLs. Addresses identify contracts, not people. These are **security-relevant execution patterns requiring review**, not confirmed exploits.

HookGuard reports security-relevant execution patterns requiring review. Target recovery is bytecode-CFG based and under-approximate. These are not confirmed exploits. HookGuard does not replace a professional smart-contract audit.

## 1. TOKEN_MOVEMENT_IN_CALLBACK

**Hook address:** `0x157628bf3f556a0e5b23c70f28c2dc04d8caa844`  
**Network:** Ethereum (1)  
**Callback:** beforeSwap  
**Target:** unrecovered  
**Operation:** CALL (transfer 0xa9059cbb)  
**Classification:** DYNAMIC  
**Confidence:** MEDIUM

### Evidence

- pc: 397
- selector: 0xa9059cbb
- protocol: —

### Why it matters

A callback-reachable CALL is paired with an ERC-20 transfer/approve/permit selector. Tokens may move during swap/liquidity execution. That is not proof of theft. HookGuard does not replace a professional smart-contract audit.

### Recommended review

- [ ] Which ERC-20 selector was recovered (transfer, transferFrom, approve, permit)?
- [ ] Is the token address a constant?
- [ ] Who receives the tokens on the callback path?

---

## 2. USER_CONTROLLED_EXTERNAL_EXECUTION

**Hook address:** `0x87853b0979c0d45ceac57675c4254f054a77a8c4`  
**Network:** Ethereum (1)  
**Callback:** beforeSwap  
**Target:** unrecovered  
**Operation:** STATICCALL 0xddca3f43  
**Classification:** USER_CONTROLLED  
**Confidence:** MEDIUM

### Evidence

- pc: 3166
- selector: 0xddca3f43
- protocol: —

### Why it matters

The CALL target appears to come from calldata. The callback may call a dynamically selected contract. This is not a vulnerability by itself. HookGuard does not replace a professional smart-contract audit.

### Recommended review

- [ ] Which calldata word becomes the address?
- [ ] Is there a whitelist before CALL?
- [ ] Is the target the swap sender or an arbitrary contract?

---

## 3. UNKNOWN_EXTERNAL_TARGET

**Hook address:** `0x0c055c6fe9090c30800ca107f0c04346b5e5b0c0`  
**Network:** Ethereum (1)  
**Callback:** beforeSwap  
**Target:** unrecovered  
**Operation:** CALL 0x8da5cb5b  
**Classification:** DYNAMIC  
**Confidence:** MEDIUM

### Evidence

- pc: 657
- selector: 0x8da5cb5b
- protocol: —

### Why it matters

A callback-reachable CALL target is not a curated protocol constant. Review who that contract is. This is not a confirmed issue. HookGuard does not replace a professional smart-contract audit.

### Recommended review

- [ ] Is the target a constant PUSH20, an SLOAD, or calldata?
- [ ] Does verified source name the callee?
- [ ] Would a swap caller influence that address?

HookGuard does not replace a professional smart-contract audit.
