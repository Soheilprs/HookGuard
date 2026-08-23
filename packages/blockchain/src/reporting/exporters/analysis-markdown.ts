import type { AnalysisResearchReport } from '../analysis-research.js';
import { ANALYSIS_RESEARCH_DETECTORS } from '../analysis-research.js';

export function exportAnalysisResearchMarkdown(report: AnalysisResearchReport): string {
  const { metrics, generatedAt, disclaimer, findings } = report;
  const cov = metrics.coverage;
  const networks = cov.networks.map((network) => `${network.name} (${network.id})`).join(', ');

  const lines: string[] = [
    '# HookGuard security analysis results',
    '',
    `Generated at: ${generatedAt}`,
    '',
    disclaimer,
    '',
    'Findings are **security-relevant implementation patterns requiring review**, not confirmed exploits.',
    '',
    '## Coverage',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    `| Networks | ${cov.networks.length} (${networks || '—'}) |`,
    `| Total hooks indexed | ${cov.hooksIndexed} |`,
    `| Hooks with verified source | ${cov.hooksWithVerifiedSource} |`,
    `| Hooks analyzed | ${cov.hooksAnalyzed} |`,
    `| Source analysis count | ${cov.sourceAnalysisCount} |`,
    `| Bytecode analysis count | ${cov.bytecodeAnalysisCount} |`,
    `| Analyzer findings | ${cov.analyzerFindings} |`,
    '',
    'Source analysis requires verified Solidity. Bytecode analysis is the fallback used when source is unavailable. A bytecode finding does **not** prove the opcode sits inside `beforeSwap`.',
    '',
    '## Detector Results',
    '',
    'Counts are unique **hooks affected** and raw finding rows. Confidence is evidence strength, not exploit confirmation.',
    '',
    '| Detector | Hooks affected | Findings | HIGH | MEDIUM | LOW |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ];

  for (const detector of ANALYSIS_RESEARCH_DETECTORS) {
    const row = metrics.detectors[detector];
    lines.push(
      `| ${detector} | ${row.hooksAffected} | ${row.findings} | ${row.confidence.HIGH} | ${row.confidence.MEDIUM} | ${row.confidence.LOW} |`,
    );
  }

  lines.push(
    '',
    '## What this corpus can and cannot show',
    '',
    `- Verified-source hooks: **${cov.hooksWithVerifiedSource}**. Detectors that require Solidity bodies (reentrancy ordering, missing guards, unrestricted call targets, custom accounting, source-bound delegatecall) stay silent without source rather than invent a callback binding.`,
    '- Bytecode-only `DANGEROUS_DELEGATECALL` means DELEGATECALL exists on a hook that also has listed lifecycle callbacks. It is a review signal, not “delegatecall in beforeSwap.”',
    '- `HOOK_PERMISSION_MISMATCH` can still fire from named ABI vs address flags when source is missing.',
    '',
    '## Evidence index',
    '',
    `Individual write-ups: \`reports/evidence/<finding-id>.md\` (${findings.length} files).`,
    '',
    'HookGuard does not replace a professional smart-contract audit.',
    '',
  );

  return `${lines.join('\n')}\n`;
}
