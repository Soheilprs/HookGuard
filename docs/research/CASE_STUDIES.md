# Case studies

Evidence-based examples from the indexed Uniswap v4 corpus. Addresses identify contracts, not people or brands.

**Do not treat these as accusations.** HookGuard does not claim the projects are malicious, that funds were stolen, or that an exploit exists. Each study records a **correlated capability** with the evidence the analyzer stored.

Snapshot: `2026-08-23T12:16:51.621Z`. Generated samples: [`reports/hookguard-security-landscape.json`](../../reports/hookguard-security-landscape.json) `caseStudies`.

Selection is deterministic: for each risk category that has at least one finding, the report picks the lexicographically first hook address on the lowest chain id. Categories with **zero** matches in this corpus are documented as such — they are not filled with invented addresses.

HookGuard does not replace a professional smart-contract audit.

---

## 1. Upgradeable swap-control hook

**Category:** `UPGRADE_SECURITY`  
**Rule:** `risk-upgradeable-swap-control`  
**Hook:** `0x083b8e471227c65579d30fc6a923ea07eecbc080` (Ethereum, chain `1`)  
**Impact:** `SWAP_PATH_LOGIC_REPLACEABLE`  
**Title:** Swap-path hook logic is upgradeable

### Required correlation

Proxy **and** swap callback **and** upgrade authority.

### Evidence (stored on the finding)

| Fact | Value |
| --- | --- |
| Proxy | `true` |
| Proxy kind | `eip-1967` |
| Implementation | `0xef19a091166534a52fa9faa4305b429adf110080` |
| Admin address | `null` (implementation slot observed; admin slot not required to fire) |
| Swap callbacks | `beforeSwap` |
| Upgrade functions | selector `0x3659cfe6` (name unknown in this unverified corpus) |
| EOA upgrade controller | `true` |

`0x3659cfe6` is the canonical `upgradeTo(address)` selector. Combined with EIP-1967 and a `beforeSwap` permission bit, the rule’s AND is satisfied.

### Impact (capability, not exploit)

Hook behavior on the swap path **can change** through a privileged upgrade. LPs who joined the pool are not guaranteed the bytecode they inspected.

### Limitations

- Upgradeability alone is not a vulnerability.
- Unnamed upgrade selector is weaker than a verified `upgradeTo` ABI item; here the EOA upgrade-controller fact raises confidence.
- This does not prove an upgrade has occurred or will occur.

Corpus: **2** hooks in `UPGRADE_SECURITY`.

---

## 2. Privileged fee modification

**Category:** `SWAP_SECURITY`  
**Rule:** `risk-privileged-fee-modification`  
**Live corpus matches:** **0**

No address is shown because the analyzer did not emit this finding for any of the 880 hooks.

### Required correlation

- swap callback (`beforeSwap` and/or `afterSwap`)
- fee setter (`setFee` name or known fee-collection selector, currently `setFee(uint24)`)
- privileged control (owner / admin / role / proxy-admin)

### Why this corpus is empty

Fee-setter detection needs a **named** function or that exact selector. This inspect run recovered **zero** verified ABIs. Unnamed bytecode selectors that do not match `setFee(uint24)` do not complete the AND. Observation rule `privileged-functions` may still list unknown privileged selectors; that is **not** this taxonomy finding.

### Impact (when the AND holds)

Trading economics **may be modified** by authorized parties. That is a capability statement, not a claim that fees were changed.

### Evidence shape (when a future inspect recovers a match)

```json
{
  "swapCallbacks": ["beforeSwap"],
  "feeSetters": [{ "name": "setFee", "selector": "0x…" }],
  "controllers": [{ "type": "owner", "address": "0x…", "source": "owner()" }],
  "eoaController": true
}
```

The landscape exporter will attach a real hook address only after a finding with that evidence exists.

---

## 3. Privileged asset movement capability

**Category:** `FUND_SAFETY`  
**Rule:** `risk-privileged-asset-movement`  
**Hook:** `0x09017ceb0966692d7fe529c1fbed36b938232088` (Ethereum, chain `1`)  
**Impact:** `PRIVILEGED_TOKEN_MOVEMENT`  
**Title:** Privileged control of token-transfer functions

### Required correlation

Token-transfer capability **and** privileged authority.

### Evidence (stored on the finding)

| Fact | Value |
| --- | --- |
| Token movers | selector `0x23b872dd` (`transferFrom(address,address,uint256)`), selector `0xa9059cbb` (`transfer(address,uint256)`); names unknown |
| Controller | type `owner`, source `owner()`, address `0xb4427ba9e1006d19362f45e3534c332b21bbe2a3` |
| EOA controller | `true` |

### Impact (capability, not exploit)

Hook-controlled assets **may be affected** by authorized accounts **if** those transfer functions are reachable. Selector presence is not a proof that the hook holds tokens or that a transfer succeeded.

### Limitations

- Unnamed selectors → low confidence unless the canonical ERC-20 selectors match (they do here).
- `owner()` being an EOA does not mean the owner called `transfer`.
- Not a theft claim.

Corpus: **17** hooks in `FUND_SAFETY`.

---

## 4. Oracle configuration capability

**Category:** `ORACLE_SECURITY`  
**Rule:** `risk-privileged-oracle-modification`  
**Live corpus matches:** **0**

No address is shown. The AND did not complete on any indexed hook.

### Required correlation

- oracle setter (`setOracle` name or known oracle selector, currently `setOracle(address)`)
- privileged control
- price-sensitive callbacks (`beforeSwap` / `afterSwap`)

### Why this corpus is empty

Same constraint as fee modification: zero verified source, and bytecode did not present the known `setOracle(address)` selector together with an owner/admin **and** a price-sensitive callback. Observation findings about unnamed privileged selectors are not re-labeled as oracle risk.

### Impact (when the AND holds)

Price-related behavior **depends on privileged configuration**. Changing the oracle can change swap-path logic without changing the hook address.

### Evidence shape (when a match exists)

```json
{
  "oracleSetters": [{ "name": "setOracle", "selector": "0x…" }],
  "priceSensitiveCallbacks": ["beforeSwap"],
  "controllers": [{ "type": "owner", "address": "0x…", "source": "owner()" }],
  "eoaController": true
}
```

---

## 5. External execution capability

**Category:** `EXTERNAL_EXECUTION`  
**Rule:** `risk-callback-external-execution`  
**Hook:** `0x0000000aa232009084bd71a5797d089aa4edfad4` (Ethereum, chain `1`)  
**Impact:** `CALLBACK_EXTERNAL_CALL`  
**Title:** External CALL/DELEGATECALL present alongside hook callbacks

This is the lexicographically first Ethereum hook in the category, not a “worst” hook.

### Required correlation

Lifecycle callback **and** `CALL` or `DELEGATECALL` in runtime bytecode (or verified source binding the call to a callback).

### Evidence (stored on the finding)

| Fact | Value |
| --- | --- |
| Lifecycle callbacks | `beforeInitialize`, `afterInitialize`, `beforeAddLiquidity`, `beforeRemoveLiquidity`, `beforeSwap`, `afterSwap`, `afterDonate` |
| CALL present | `true` |
| DELEGATECALL present | `false` |
| Source-bound lifecycle calls | `[]` |
| Reachable from hook callback | `false` |

`reachableFromHookCallback` is **false** because no verified source associated the opcode with a callback. The finding still records the capability: callbacks exist **and** `CALL` exists.

### Impact (capability, not exploit)

The hook **executes (or can execute) external contract interactions**. That is common on Uniswap v4. It is also how callback-time token, oracle, or router interactions happen. HookGuard does not upgrade this to “external call in the swap path” without source binding.

### Limitations

- Opcode walk skips PUSH immediates; it is not a control-flow graph.
- 815 hooks share this category. Prevalence is a landscape fact, not 815 incidents.

---

## Reading guide

| Study | Address shown? | Why |
| --- | --- | --- |
| Upgradeable swap-control | Yes | 2 matches; first address on chain 1 |
| Privileged fee modification | No | 0 matches; inventing one would violate evidence rules |
| Privileged asset movement | Yes | 17 matches; first address on chain 1 |
| Oracle configuration | No | 0 matches |
| External execution | Yes | 815 matches; first address on chain 1 |

Regenerate samples with `npm run report:risk`. Do not copy these addresses into marketing as “vulnerable projects.”
