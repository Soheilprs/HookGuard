# Risk framework

HookGuard reports **security-relevant capabilities and configurations**, not “this contract is malicious.”

It does not detect exploits. It does not assign a numerical risk score. It does not replace a professional smart-contract audit.

A risk finding is emitted only when **multiple independent facts** correlate. Every finding includes evidence JSON. The engine drops any candidate with empty evidence.

## Categories

| Category | Meaning |
| --- | --- |
| `FUND_SAFETY` | Privileged control together with token-transfer capability |
| `SWAP_SECURITY` | Swap callbacks together with privileged fee control |
| `UPGRADE_SECURITY` | Proxy + swap callback + upgrade authority |
| `ADMIN_CONTROL` | Owner/admin together with configuration mutators |
| `ORACLE_SECURITY` | Oracle setter + privileged control + price-sensitive callback |
| `EXTERNAL_EXECUTION` | Hook callback observed **and** CALL/DELEGATECALL in bytecode |
| `PERMISSION_SECURITY` | Reserved for flag/callback mismatches (not emitted as a “vuln” by itself) |

Observation rules from earlier phases (`proxy-used`, `ownership-owner`, opcode CALL, …) still run. They keep their original categories (`upgradeability`, `access-control`, …). Risk rules add a second layer with the taxonomy above.

## Severity vs confidence

**Severity** is how serious the *capability* would be if exercised (EOA upgrade of swap-path logic can be `critical`).

**Confidence** is how directly the evidence supports the correlation.

| | |
| --- | --- |
| HIGH confidence | Named ABI / successful `owner()` / EIP-1967 slot |
| LOW confidence | Selector-only or bytecode opcode without source binding |

A CALL opcode plus a callback is **not** described as “external call in the swap path” unless verified source associates the call with that function.

## Impact and affected component

| Field | Role |
| --- | --- |
| `impact` | What the correlated capability could affect (`SWAP_PATH_LOGIC_REPLACEABLE`, …) |
| `affectedComponent` | Where (`hook-proxy`, `token-movement`, `fee-controller`, `oracle`, `hook-callbacks`, `owner-admin`) |

## Evidence requirements

| Rule | Required facts |
| --- | --- |
| Upgradeable swap-control | `isProxy` **and** swap callback **and** upgrade authority |
| Privileged asset movement | transfer/transferFrom (name or selector) **and** owner/admin |
| Privileged fee modification | swap callback **and** fee setter **and** owner/admin |
| Privileged oracle modification | oracle setter **and** owner/admin **and** beforeSwap/afterSwap |
| External execution in callbacks | lifecycle callback **and** CALL or DELEGATECALL |
| Privileged admin control | owner/admin **and** named configuration mutators (not owner() alone) |

Missing any required fact → no risk finding (false-positive prevention). Existing observation findings may still appear.

## Limitations

- Capability ≠ exploit. Reachability, access-control on the setter, and runtime paths are not fully proven from bytecode.
- Unnamed selectors are low confidence (possible collisions).
- `PERMISSION_SECURITY` is documented for flag/callback comparison; extra implemented callbacks are not auto-vulnerabilities.
- No numerical score is produced from these categories.
