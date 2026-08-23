import { RISK_CATEGORY_LABELS } from '../../analysis/risk/taxonomy.js';
import type { LandscapeReport } from '../metrics.js';

export function exportLandscapeMarkdown(report: LandscapeReport): string {
  const { metrics, generatedAt, disclaimer, caseStudies } = report;
  const cov = metrics.coverage;
  const networks = cov.networks.map((network) => `${network.name} (${network.id})`).join(', ');

  const lines: string[] = [
    '# HookGuard security landscape',
    '',
    `Generated at: ${generatedAt}`,
    '',
    disclaimer,
    '',
    '## Ecosystem Coverage',
    '',
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| Networks | ${cov.networks.length} (${networks || '—'}) |`,
    `| Hooks analyzed | ${cov.hooksAnalyzed} |`,
    `| Pools indexed | ${cov.poolsIndexed} |`,
    `| Findings | ${cov.findings} |`,
    `| Monitored hooks | ${cov.monitoredHooks} |`,
    `| Security events | ${cov.securityEvents} |`,
    '',
    '## Risk Category Distribution',
    '',
    'Counts are **unique hooks** with at least one finding in that taxonomy category, not raw finding rows.',
    '',
    `| Category | Hooks affected |`,
    `| --- | ---: |`,
  ];

  for (const [category, count] of Object.entries(metrics.riskCategoryHooks)) {
    const label = RISK_CATEGORY_LABELS[category as keyof typeof RISK_CATEGORY_LABELS] ?? category;
    lines.push(`| ${category} (${label}) | ${count} |`);
  }

  lines.push(
    '',
    '## Severity Distribution',
    '',
    'Severity is potential impact of the observed capability. It does **not** mean confirmed exploitation.',
    '',
    `| Severity | Findings | Unique hooks |`,
    `| --- | ---: | ---: |`,
    `| CRITICAL | ${metrics.severityFindings.critical} | ${metrics.severityHooks.critical} |`,
    `| HIGH | ${metrics.severityFindings.high} | ${metrics.severityHooks.high} |`,
    `| MEDIUM | ${metrics.severityFindings.medium} | ${metrics.severityHooks.medium} |`,
    `| LOW | ${metrics.severityFindings.low} | ${metrics.severityHooks.low} |`,
    '',
    '## Confidence Distribution',
    '',
    'Confidence measures evidence strength, not whether an attack occurred.',
    '',
    '| Band | Meaning | Findings |',
    '| --- | --- | ---: |',
    `| CONFIRMED | Manual review marked the observation confirmed | ${metrics.confidenceFindings.CONFIRMED} |`,
    `| STRONG | High-confidence evidence (slots, successful calls, named ABI) | ${metrics.confidenceFindings.STRONG} |`,
    `| OBSERVED | Medium/low confidence or incomplete naming | ${metrics.confidenceFindings.OBSERVED} |`,
    '',
    '## Hook Capability Overview',
    '',
    'Callback counts come from Uniswap v4 permission bits in the hook address. Upgradeable counts use EIP-1967 proxy facts. External execution counts hooks with CALL/DELEGATECALL observations or the correlated EXTERNAL_EXECUTION finding.',
    '',
    `| Capability | Hooks |`,
    `| --- | ---: |`,
    `| beforeSwap | ${metrics.capabilities.beforeSwap} |`,
    `| afterSwap | ${metrics.capabilities.afterSwap} |`,
    `| beforeAddLiquidity | ${metrics.capabilities.beforeAddLiquidity} |`,
    `| afterAddLiquidity | ${metrics.capabilities.afterAddLiquidity} |`,
    `| Upgradeable (proxy) | ${metrics.capabilities.upgradeable} |`,
    `| Privileged admin controls | ${metrics.capabilities.privilegedAdmin} |`,
    `| External execution capabilities | ${metrics.capabilities.externalExecution} |`,
    '',
    '## Evidence samples',
    '',
  );

  if (caseStudies.length === 0) {
    lines.push(
      'No correlated risk-taxonomy findings were present in this corpus. Observation-level findings may still exist.',
      '',
    );
  } else {
    for (const study of caseStudies) {
      lines.push(
        `### ${study.category}`,
        '',
        `- Rule: \`${study.ruleId}\``,
        `- Hook: \`${study.hookAddress}\` (chain ${study.chainId})`,
        `- Title: ${study.title}`,
        `- Impact: ${study.impact ?? '—'}`,
        `- Evidence keys: ${Object.keys(study.evidence).sort().join(', ') || '—'}`,
        '',
      );
    }
  }

  lines.push('HookGuard does not replace a professional smart-contract audit.', '');
  return `${lines.join('\n')}\n`;
}
