# HookGuard security analysis results

Generated at: 2026-08-23T12:56:04.061Z

HookGuard reports security-relevant implementation patterns that require review. These are not confirmed exploits, not accusations of malice, and not proof that user funds are at risk. HookGuard does not replace a professional smart-contract audit.

Findings are **security-relevant implementation patterns requiring review**, not confirmed exploits.

## Coverage

| Metric | Count |
| --- | ---: |
| Networks | 2 (Ethereum (1), Unichain (130)) |
| Total hooks indexed | 880 |
| Hooks with verified source | 0 |
| Hooks analyzed | 880 |
| Source analysis count | 0 |
| Bytecode analysis count | 880 |
| Analyzer findings | 409 |

Source analysis requires verified Solidity. Bytecode analysis is the fallback used when source is unavailable. A bytecode finding does **not** prove the opcode sits inside `beforeSwap`.

## Detector Results

Counts are unique **hooks affected** and raw finding rows. Confidence is evidence strength, not exploit confirmation.

| Detector | Hooks affected | Findings | HIGH | MEDIUM | LOW |
| --- | ---: | ---: | ---: | ---: | ---: |
| CALLBACK_REENTRANCY_RISK | 0 | 0 | 0 | 0 | 0 |
| MISSING_ACCESS_CONTROL | 0 | 0 | 0 | 0 | 0 |
| UNRESTRICTED_EXTERNAL_EXECUTION | 0 | 0 | 0 | 0 | 0 |
| DANGEROUS_DELEGATECALL | 409 | 409 | 0 | 0 | 409 |
| CUSTOM_ACCOUNTING_REVIEW | 0 | 0 | 0 | 0 | 0 |
| HOOK_PERMISSION_MISMATCH | 0 | 0 | 0 | 0 | 0 |

## What this corpus can and cannot show

- Verified-source hooks: **0**. Detectors that require Solidity bodies (reentrancy ordering, missing guards, unrestricted call targets, custom accounting, source-bound delegatecall) stay silent without source rather than invent a callback binding.
- Bytecode-only `DANGEROUS_DELEGATECALL` means DELEGATECALL exists on a hook that also has listed lifecycle callbacks. It is a review signal, not “delegatecall in beforeSwap.”
- `HOOK_PERMISSION_MISMATCH` can still fire from named ABI vs address flags when source is missing.

## Evidence index

Individual write-ups: `reports/evidence/<finding-id>.md` (409 files).

HookGuard does not replace a professional smart-contract audit.

