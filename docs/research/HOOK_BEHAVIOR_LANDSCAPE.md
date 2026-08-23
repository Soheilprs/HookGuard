# Hook behavior landscape

Generated at: 2026-08-23T13:30:26.091Z

Public ecosystem report of **observed** Uniswap v4 hook external interactions. Not user counts, TVL, or exploit proofs.

HookGuard reports security-relevant execution patterns requiring review. Target recovery is bytecode-CFG based and under-approximate. These are not confirmed exploits. HookGuard does not replace a professional smart-contract audit.

## External dependency statistics

| | |
| --- | ---: |
| Hooks analyzed | 880 |
| Callbacks that CALL | 39 |
| Known protocol matches | 0 |
| ERC-20 movement selectors | 19 |
| Unknown / dynamic targets | 39 |
| Calldata-derived targets | 4 |

## Most common interactions

- transfer: 27
- DYNAMIC: 24
- transferFrom: 4
- USER_CONTROLLED: 4
- approve: 3

## Callback behavior

Interaction findings are bound to recovered lifecycle callbacks (typically `beforeSwap` / `afterSwap`) when dispatcher + CFG path exist.

## Examples

- `0x157628bf3f556a0e5b23c70f28c2dc04d8caa844` TOKEN_MOVEMENT_IN_CALLBACK callback=beforeSwap target=—
- `0x87853b0979c0d45ceac57675c4254f054a77a8c4` USER_CONTROLLED_EXTERNAL_EXECUTION callback=beforeSwap target=—
- `0x0c055c6fe9090c30800ca107f0c04346b5e5b0c0` UNKNOWN_EXTERNAL_TARGET callback=beforeSwap target=—

HookGuard does not replace a professional smart-contract audit.
