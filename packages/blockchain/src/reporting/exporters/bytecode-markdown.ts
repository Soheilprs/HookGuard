import { BYTECODE_CFG_DETECTORS, type BytecodeResearchReport } from '../bytecode-research.js';

export function exportBytecodeResearchJson(report: BytecodeResearchReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function exportBytecodeResearchMarkdown(report: BytecodeResearchReport): string {
  const { metrics, generatedAt, disclaimer } = report;
  const lines = [
    '# HookGuard bytecode intelligence results',
    '',
    `Generated at: ${generatedAt}`,
    '',
    disclaimer,
    '',
    'Findings are **security-relevant execution patterns requiring review**, not confirmed exploits.',
    '',
    '## Coverage',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    `| Hooks indexed | ${metrics.hooksIndexed} |`,
    `| Hooks analyzed | ${metrics.hooksAnalyzed} |`,
    `| DELEGATECALL opcode present (before) | ${metrics.opcodeDelegatecallHooks} |`,
    `| DELEGATECALL reachable from a callback (after) | ${metrics.reachableDelegatecallHooks} |`,
    `| CALL reachable from a callback | ${metrics.reachableCallHooks} |`,
    `| SSTORE reachable from a callback | ${metrics.reachableSstoreHooks} |`,
    `| CALL/DELEGATECALL before SSTORE on a callback path | ${metrics.callBeforeSstoreHooks} |`,
    '',
    'Unresolved JUMP/JUMPI destinations are **not** followed. Reachable counts are therefore under-approximate.',
    '',
    '## Detector results',
    '',
    '| Detector | Hooks | Findings | HIGH | MEDIUM | LOW |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const detector of BYTECODE_CFG_DETECTORS) {
    const row = metrics.detectors[detector];
    lines.push(
      `| ${detector} | ${row.hooksAffected} | ${row.findings} | ${row.confidence.HIGH} | ${row.confidence.MEDIUM} | ${row.confidence.LOW} |`,
    );
  }
  lines.push(
    '',
    '## Before vs after',
    '',
    `Opcode-level DELEGATECALL observations: **${metrics.opcodeDelegatecallHooks}**.`,
    '',
    `Callback-reachable DELEGATECALL (CFG): **${metrics.reachableDelegatecallHooks}**.`,
    '',
    'HookGuard does not replace a professional smart-contract audit.',
    '',
  );
  return `${lines.join('\n')}\n`;
}
