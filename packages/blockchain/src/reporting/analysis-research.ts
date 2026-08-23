import { findingGuidanceFor } from '../guidance/playbook.js';
import { IMPACT_LABELS } from '../analysis/risk/impact.js';
import type { RiskImpact } from '@hookguard/types';
import type { ReportNetwork } from './metrics.js';

export const ANALYSIS_RESEARCH_DETECTORS = [
  'CALLBACK_REENTRANCY_RISK',
  'MISSING_ACCESS_CONTROL',
  'UNRESTRICTED_EXTERNAL_EXECUTION',
  'DANGEROUS_DELEGATECALL',
  'CUSTOM_ACCOUNTING_REVIEW',
  'HOOK_PERMISSION_MISMATCH',
] as const;

export type AnalysisResearchDetector = (typeof ANALYSIS_RESEARCH_DETECTORS)[number];

export const ANALYSIS_RESEARCH_DISCLAIMER =
  'HookGuard reports security-relevant implementation patterns that require review. These are not confirmed exploits, not accusations of malice, and not proof that user funds are at risk. HookGuard does not replace a professional smart-contract audit.';

export interface AnalysisResearchFindingInput {
  id: string;
  hookAddress: string;
  chainId: number;
  network: string;
  ruleId: string;
  title: string;
  description: string;
  severity: string;
  confidence: string;
  impact: string | null;
  functionName: string | null;
  sourceLocation: string | null;
  codeSnippet: string | null;
  analysisType: string | null;
  evidence: Record<string, unknown>;
}

export interface AnalysisResearchHook {
  id: string;
  address: string;
  chainId: number;
  sourceVerified: boolean;
  analyzed: boolean;
  findings: AnalysisResearchFindingInput[];
}

export interface AnalysisResearchCorpus {
  generatedAt: string;
  networks: ReportNetwork[];
  hooksIndexed: number;
  hooksWithVerifiedSource: number;
  hooks: AnalysisResearchHook[];
}

export interface DetectorResult {
  detector: AnalysisResearchDetector;
  hooksAffected: number;
  findings: number;
  confidence: { HIGH: number; MEDIUM: number; LOW: number };
}

export interface AnalysisResearchMetrics {
  coverage: {
    networks: ReportNetwork[];
    hooksIndexed: number;
    hooksWithVerifiedSource: number;
    hooksAnalyzed: number;
    sourceAnalysisCount: number;
    bytecodeAnalysisCount: number;
    analyzerFindings: number;
  };
  detectors: Record<AnalysisResearchDetector, DetectorResult>;
}

export interface AnalysisResearchEntry {
  id: string;
  detector: AnalysisResearchDetector;
  hookAddress: string;
  chainId: number;
  network: string;
  severity: string;
  confidence: string;
  functionName: string | null;
  sourceLocation: string | null;
  codeSnippet: string | null;
  analysisType: string | null;
  title: string;
  evidence: Record<string, unknown>;
  whyItMatters: string;
  reviewActions: string[];
}

export interface AnalysisResearchReport {
  generatedAt: string;
  disclaimer: string;
  metrics: AnalysisResearchMetrics;
  findings: AnalysisResearchEntry[];
}

export function isAnalysisResearchDetector(
  value: string,
): value is AnalysisResearchDetector {
  return (ANALYSIS_RESEARCH_DETECTORS as readonly string[]).includes(value);
}

export function buildAnalysisResearchReport(
  corpus: AnalysisResearchCorpus,
): AnalysisResearchReport {
  const analyzedHooks = corpus.hooks.filter((hook) => hook.analyzed);
  const analyzerFindings = analyzedHooks.flatMap((hook) =>
    hook.findings.filter((finding) => isAnalysisResearchDetector(finding.ruleId)),
  );

  const detectors = {} as Record<AnalysisResearchDetector, DetectorResult>;
  for (const detector of ANALYSIS_RESEARCH_DETECTORS) {
    const rows = analyzerFindings.filter((finding) => finding.ruleId === detector);
    const hooks = new Set(
      analyzedHooks
        .filter((hook) => hook.findings.some((finding) => finding.ruleId === detector))
        .map((hook) => `${hook.chainId}:${hook.address.toLowerCase()}`),
    );
    detectors[detector] = {
      detector,
      hooksAffected: hooks.size,
      findings: rows.length,
      confidence: {
        HIGH: rows.filter((row) => row.confidence.toUpperCase() === 'HIGH').length,
        MEDIUM: rows.filter((row) => row.confidence.toUpperCase() === 'MEDIUM').length,
        LOW: rows.filter((row) => row.confidence.toUpperCase() === 'LOW').length,
      },
    };
  }

  const findings = analyzerFindings
    .map((finding) => toEntry(finding))
    .sort((a, b) => {
      const chain = a.chainId - b.chainId;
      if (chain !== 0) return chain;
      const addr = a.hookAddress.localeCompare(b.hookAddress);
      if (addr !== 0) return addr;
      return a.detector.localeCompare(b.detector);
    });

  return {
    generatedAt: corpus.generatedAt,
    disclaimer: ANALYSIS_RESEARCH_DISCLAIMER,
    metrics: {
      coverage: {
        networks: [...corpus.networks].sort((a, b) => a.id - b.id),
        hooksIndexed: corpus.hooksIndexed,
        hooksWithVerifiedSource: corpus.hooksWithVerifiedSource,
        hooksAnalyzed: analyzedHooks.length,
        sourceAnalysisCount: analyzedHooks.filter((hook) => hook.sourceVerified).length,
        bytecodeAnalysisCount: analyzedHooks.filter((hook) => !hook.sourceVerified).length,
        analyzerFindings: findings.length,
      },
      detectors,
    },
    findings,
  };
}

export function assertAnalysisResearchEvidence(report: AnalysisResearchReport): void {
  for (const finding of report.findings) {
    if (!finding.evidence || Object.keys(finding.evidence).length === 0) {
      throw new Error(`Research finding ${finding.id} is missing evidence`);
    }
    if (!finding.whyItMatters.trim()) {
      throw new Error(`Research finding ${finding.id} is missing an explanation`);
    }
  }
}

function toEntry(finding: AnalysisResearchFindingInput): AnalysisResearchEntry {
  const detector = finding.ruleId as AnalysisResearchDetector;
  const guidance = findingGuidanceFor({
    category: detector,
    impact: finding.impact,
    ruleId: finding.ruleId,
  });
  const impactLabel =
    finding.impact && finding.impact in IMPACT_LABELS
      ? IMPACT_LABELS[finding.impact as RiskImpact]
      : null;
  return {
    id: finding.id,
    detector,
    hookAddress: finding.hookAddress.toLowerCase(),
    chainId: finding.chainId,
    network: finding.network,
    severity: finding.severity,
    confidence: finding.confidence,
    functionName: finding.functionName,
    sourceLocation: finding.sourceLocation,
    codeSnippet: finding.codeSnippet,
    analysisType: finding.analysisType,
    title: finding.title,
    evidence: finding.evidence,
    whyItMatters: impactLabel
      ? `${impactLabel} ${guidance.guidance}`
      : guidance.guidance,
    reviewActions: guidance.reviewQuestions,
  };
}

export function emptyDetectorResults(): Record<AnalysisResearchDetector, DetectorResult> {
  return Object.fromEntries(
    ANALYSIS_RESEARCH_DETECTORS.map((detector) => [
      detector,
      { detector, hooksAffected: 0, findings: 0, confidence: { HIGH: 0, MEDIUM: 0, LOW: 0 } },
    ]),
  ) as Record<AnalysisResearchDetector, DetectorResult>;
}
