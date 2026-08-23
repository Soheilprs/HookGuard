import type { AnalysisResearchEntry } from '../analysis-research.js';

const BYTECODE_KEYS = [
  'opcode',
  'lifecycleCallbacks',
  'reachableFromHookCallback',
  'callbacks',
  'callTargets',
  'targets',
  'flagsSet',
  'callbacksFound',
  'extraImplemented',
  'missingExpected',
  'functions',
  'hookDataDecode',
  'usesBeforeOrAfterSwapDelta',
  'callBeforeLaterWrite',
  'stateWrites',
];

export function exportEvidenceMarkdown(finding: AnalysisResearchEntry): string {
  const lines: string[] = [
    '# Finding',
    '',
    'This is a **security-relevant implementation pattern requiring review**. It is not a confirmed exploit, not an accusation, and not proof that user funds are at risk.',
    '',
    '## Detector',
    '',
    finding.detector,
    '',
    '## Hook',
    '',
    `\`${finding.hookAddress}\``,
    '',
    '## Network',
    '',
    `${finding.network} (${finding.chainId})`,
    '',
    '## Severity',
    '',
    finding.severity.toUpperCase(),
    '',
    '## Confidence',
    '',
    `${finding.confidence} (evidence strength, not confirmed exploitation)`,
    '',
    '## Affected function',
    '',
    finding.functionName ?? 'Not bound to a named function (bytecode or ABI-level observation).',
    '',
    '## Source location',
    '',
    finding.sourceLocation ?? 'Unavailable (no verified source span).',
    '',
  ];

  if (finding.codeSnippet) {
    lines.push('## Source code snippet', '', '```solidity', finding.codeSnippet.trim(), '```', '');
  } else {
    lines.push(
      '## Source code snippet',
      '',
      'Unavailable. This finding used bytecode or ABI facts. It does not include a Solidity span.',
      '',
    );
  }

  const bytecode = bytecodeEvidence(finding.evidence);
  lines.push('## Bytecode / structured evidence', '');
  if (Object.keys(bytecode).length === 0) {
    lines.push('No additional bytecode fields beyond the snippet/location above.', '');
  } else {
    lines.push('```json', JSON.stringify(bytecode, null, 2), '```', '');
  }

  lines.push(
    '## Why it matters',
    '',
    finding.whyItMatters,
    '',
    '## Recommended review action',
    '',
  );
  for (const action of finding.reviewActions) {
    lines.push(`- [ ] ${action}`);
  }
  lines.push(
    '',
    '## Analysis type',
    '',
    finding.analysisType ?? 'unspecified',
    '',
    'Finding id: `' + finding.id + '`',
    '',
    'HookGuard does not replace a professional smart-contract audit.',
    '',
  );
  return `${lines.join('\n')}\n`;
}

export function evidenceFileName(finding: AnalysisResearchEntry): string {
  return `${finding.id}.md`;
}

function bytecodeEvidence(evidence: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of BYTECODE_KEYS) {
    if (key in evidence && evidence[key] !== undefined) {
      out[key] = evidence[key];
    }
  }
  return out;
}
