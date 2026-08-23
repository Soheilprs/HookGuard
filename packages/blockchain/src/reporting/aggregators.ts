import { hookAddressFlags } from '../analysis/rules/hooks.rules.js';
import { isRiskCategory, type RiskCategory } from '../analysis/risk/taxonomy.js';
import type {
  CapabilityMetrics,
  LandscapeCaseStudy,
  LandscapeConfidence,
  LandscapeMetrics,
  ReportCorpus,
  ReportFinding,
  ReportHook,
} from './metrics.js';
import { RISK_CATEGORY_LIST } from './metrics.js';

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

export function mapLandscapeConfidence(finding: ReportFinding): LandscapeConfidence | null {
  if (finding.validationStatus === 'FALSE_POSITIVE') return null;
  if (finding.validationStatus === 'CONFIRMED') return 'CONFIRMED';
  if (finding.confidence.toUpperCase() === 'HIGH') return 'STRONG';
  return 'OBSERVED';
}

export function emptyRiskCategoryCounts(): Record<RiskCategory, number> {
  return Object.fromEntries(RISK_CATEGORY_LIST.map((key) => [key, 0])) as Record<
    RiskCategory,
    number
  >;
}

export function computeLandscapeMetrics(corpus: ReportCorpus): LandscapeMetrics {
  const findings = corpus.hooks.flatMap((hook) => hook.findings);
  const riskCategoryHooks = emptyRiskCategoryCounts();
  for (const category of RISK_CATEGORY_LIST) {
    riskCategoryHooks[category] = uniqueHooksWith(corpus.hooks, (finding) =>
      isRiskCategory(finding.category) && finding.category === category,
    );
  }

  const severityFindings = { critical: 0, high: 0, medium: 0, low: 0 };
  const severityHooks = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const severity of SEVERITIES) {
    severityFindings[severity] = findings.filter(
      (finding) => finding.severity.toLowerCase() === severity,
    ).length;
    severityHooks[severity] = uniqueHooksWith(
      corpus.hooks,
      (finding) => finding.severity.toLowerCase() === severity,
    );
  }

  const confidenceFindings = { CONFIRMED: 0, STRONG: 0, OBSERVED: 0 };
  for (const finding of findings) {
    const band = mapLandscapeConfidence(finding);
    if (band) confidenceFindings[band] += 1;
  }

  return {
    coverage: {
      networks: [...corpus.networks].sort((a, b) => a.id - b.id),
      hooksAnalyzed: corpus.hooks.length,
      poolsIndexed: corpus.poolsIndexed,
      findings: findings.length,
      monitoredHooks: corpus.monitoredHooks,
      securityEvents: corpus.securityEvents,
    },
    riskCategoryHooks,
    severityFindings,
    severityHooks,
    confidenceFindings,
    capabilities: computeCapabilities(corpus.hooks),
  };
}

export function selectCaseStudies(corpus: ReportCorpus): LandscapeCaseStudy[] {
  const studies: LandscapeCaseStudy[] = [];
  for (const category of RISK_CATEGORY_LIST) {
    const candidates = corpus.hooks
      .flatMap((hook) =>
        hook.findings
          .filter((finding) => finding.category === category)
          .map((finding) => ({ hook, finding })),
      )
      .sort((a, b) => {
        const chain = a.hook.chainId - b.hook.chainId;
        if (chain !== 0) return chain;
        return a.hook.address.localeCompare(b.hook.address);
      });
    const picked = candidates[0];
    if (!picked) continue;
    studies.push({
      category,
      ruleId: picked.finding.ruleId,
      hookAddress: picked.hook.address.toLowerCase(),
      chainId: picked.hook.chainId,
      title: picked.finding.title,
      impact: picked.finding.impact,
      evidence: picked.finding.evidence,
    });
  }
  return studies;
}

function computeCapabilities(hooks: ReportHook[]): CapabilityMetrics {
  return {
    beforeSwap: countAddressFlag(hooks, 'beforeSwap'),
    afterSwap: countAddressFlag(hooks, 'afterSwap'),
    beforeAddLiquidity: countAddressFlag(hooks, 'beforeAddLiquidity'),
    afterAddLiquidity: countAddressFlag(hooks, 'afterAddLiquidity'),
    upgradeable: hooks.filter((hook) => hook.isProxy || hasRule(hook, 'proxy-used')).length,
    privilegedAdmin: uniqueHooksWith(
      hooks,
      (finding) =>
        finding.category === 'ADMIN_CONTROL' ||
        finding.ruleId === 'ownership-owner-eoa' ||
        finding.ruleId === 'privileged-functions',
    ),
    externalExecution: uniqueHooksWith(
      hooks,
      (finding) =>
        finding.category === 'EXTERNAL_EXECUTION' ||
        finding.ruleId === 'ext-call' ||
        finding.ruleId === 'ext-delegatecall',
    ),
  };
}

function countAddressFlag(hooks: ReportHook[], flag: string): number {
  return hooks.filter((hook) => {
    try {
      return hookAddressFlags(hook.address).includes(flag);
    } catch {
      return false;
    }
  }).length;
}

function hasRule(hook: ReportHook, ruleId: string): boolean {
  return hook.findings.some((finding) => finding.ruleId === ruleId);
}

function uniqueHooksWith(
  hooks: ReportHook[],
  predicate: (finding: ReportFinding) => boolean,
): number {
  return hooks.filter((hook) => hook.findings.some(predicate)).length;
}
