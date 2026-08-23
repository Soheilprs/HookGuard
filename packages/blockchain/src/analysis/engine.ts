import type { FindingSeverity } from '@hookguard/types';
import { externalCallRules } from './rules/external-call.rules.js';
import { hooksRules } from './rules/hooks.rules.js';
import { ownershipRules } from './rules/ownership.rules.js';
import { permissionsRules } from './rules/permissions.rules.js';
import { proxyRules } from './rules/proxy.rules.js';
import { riskRules } from './risk/risk-engine.js';
import type { AnalysisInput, AnalysisRule, EngineFinding } from './types.js';

export const DEFAULT_RULES: AnalysisRule[] = [
  ...proxyRules,
  ...ownershipRules,
  ...hooksRules,
  ...externalCallRules,
  ...permissionsRules,
  ...riskRules,
];

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function runAnalysis(
  input: AnalysisInput,
  rules: AnalysisRule[] = DEFAULT_RULES,
): EngineFinding[] {
  const findings: EngineFinding[] = [];
  for (const rule of rules) {
    const produced = rule.run(input);
    for (const finding of produced) {
      if (!finding.evidence || Object.keys(finding.evidence).length === 0) {
        continue;
      }
      findings.push({ ...finding, ruleId: finding.ruleId || rule.id });
    }
  }

  const byRule = new Map<string, EngineFinding>();
  for (const finding of findings) {
    byRule.set(finding.ruleId, finding);
  }

  return [...byRule.values()].sort((a, b) => {
    const severity =
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
    if (severity !== 0) return severity;
    return a.ruleId.localeCompare(b.ruleId);
  });
}

export function engineRuleIds(rules: AnalysisRule[] = DEFAULT_RULES): string[] {
  return rules.map((rule) => rule.id);
}
