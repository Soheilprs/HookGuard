# HookGuard interaction analysis

Generated at: 2026-08-23T13:30:26.091Z

HookGuard reports security-relevant execution patterns requiring review. Target recovery is bytecode-CFG based and under-approximate. These are not confirmed exploits. HookGuard does not replace a professional smart-contract audit.

Findings are **security-relevant execution patterns requiring review**, not confirmed exploits.

## Coverage

| Metric | Count |
| --- | ---: |
| Hooks indexed | 880 |
| Hooks analyzed | 880 |
| Callback external calls | 39 |
| ERC-20 interactions | 19 |
| Unknown targets | 39 |
| User-controlled targets | 4 |
| Known protocol targets | 0 |

## Detector results

| Detector | Hooks | Findings |
| --- | ---: | ---: |
| TOKEN_MOVEMENT_IN_CALLBACK | 19 | 19 |
| USER_CONTROLLED_EXTERNAL_EXECUTION | 4 | 4 |
| PROTOCOL_INTERACTION | 0 | 0 |
| UNKNOWN_EXTERNAL_TARGET | 39 | 39 |

## Case studies

- `0x157628bf3f556a0e5b23c70f28c2dc04d8caa844` TOKEN_MOVEMENT_IN_CALLBACK callback=beforeSwap target=—
- `0x87853b0979c0d45ceac57675c4254f054a77a8c4` USER_CONTROLLED_EXTERNAL_EXECUTION callback=beforeSwap target=—
- `0x0c055c6fe9090c30800ca107f0c04346b5e5b0c0` UNKNOWN_EXTERNAL_TARGET callback=beforeSwap target=—

HookGuard does not replace a professional smart-contract audit.
