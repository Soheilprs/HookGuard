import { INTERACTION_RULE_IDS } from '../interaction-analysis/engine.js';
import { findingGuidanceFor } from '../guidance/playbook.js';
import type { ReportNetwork } from './metrics.js';

export const INTERACTION_DETECTORS = [...INTERACTION_RULE_IDS] as const;

export type InteractionDetector = (typeof INTERACTION_DETECTORS)[number];

export const INTERACTION_DISCLAIMER =
  'HookGuard reports security-relevant execution patterns requiring review. Target recovery is bytecode-CFG based and under-approximate. These are not confirmed exploits. HookGuard does not replace a professional smart-contract audit.';

export interface InteractionFindingView {
  id: string;
  detector: string;
  hookAddress: string;
  chainId: number;
  network: string;
  callback: string | null;
  targetAddress: string | null;
  targetType: string | null;
  selector: string | null;
  selectorName: string | null;
  protocolName: string | null;
  opcode: string | null;
  pc: number | null;
  confidence: string;
  severity: string;
  evidence: Record<string, unknown>;
  whyItMatters: string;
  reviewActions: string[];
}

export interface InteractionHookRow {
  id: string;
  address: string;
  chainId: number;
  analyzed: boolean;
  findings: InteractionFindingView[];
}

export interface InteractionCorpus {
  generatedAt: string;
  networks: ReportNetwork[];
  hooksIndexed: number;
  callbackExternalCallHooks: number;
  hooks: InteractionHookRow[];
}

export interface InteractionMetrics {
  hooksIndexed: number;
  hooksAnalyzed: number;
  callbackExternalCalls: number;
  erc20Interactions: number;
  unknownTargets: number;
  userControlled: number;
  knownProtocols: number;
  detectors: Record<
    InteractionDetector,
    { hooksAffected: number; findings: number }
  >;
}

export interface InteractionReport {
  generatedAt: string;
  disclaimer: string;
  metrics: InteractionMetrics;
  findings: InteractionFindingView[];
  caseStudies: InteractionFindingView[];
}

export function annotateInteractionFinding(input: {
  id: string;
  detector: string;
  hookAddress: string;
  chainId: number;
  network: string;
  severity: string;
  confidence: string;
  evidence: Record<string, unknown>;
}): InteractionFindingView {
  const guidance = findingGuidanceFor({
    category: 'EXTERNAL_EXECUTION',
    ruleId: input.detector,
  });
  return {
    ...input,
    hookAddress: input.hookAddress.toLowerCase(),
    callback: str(input.evidence.callback),
    targetAddress: str(input.evidence.targetAddress),
    targetType: str(input.evidence.targetType),
    selector: str(input.evidence.selector),
    selectorName: str(input.evidence.selectorName),
    protocolName: str(input.evidence.protocolName),
    opcode: str(input.evidence.opcode),
    pc: typeof input.evidence.pc === 'number' ? input.evidence.pc : null,
    whyItMatters: guidance.guidance,
    reviewActions: guidance.reviewQuestions,
  };
}

export function buildInteractionReport(corpus: InteractionCorpus): InteractionReport {
  const analyzed = corpus.hooks.filter((hook) => hook.analyzed);
  const findings = analyzed
    .flatMap((hook) => hook.findings)
    .sort((a, b) => {
      const chain = a.chainId - b.chainId;
      if (chain !== 0) return chain;
      return a.hookAddress.localeCompare(b.hookAddress) || a.detector.localeCompare(b.detector);
    });

  const detectors = {} as InteractionMetrics['detectors'];
  for (const detector of INTERACTION_DETECTORS) {
    const rows = findings.filter((item) => item.detector === detector);
    detectors[detector] = {
      hooksAffected: new Set(rows.map((item) => `${item.chainId}:${item.hookAddress}`)).size,
      findings: rows.length,
    };
  }

  return {
    generatedAt: corpus.generatedAt,
    disclaimer: INTERACTION_DISCLAIMER,
    metrics: {
      hooksIndexed: corpus.hooksIndexed,
      hooksAnalyzed: analyzed.length,
      callbackExternalCalls: corpus.callbackExternalCallHooks,
      erc20Interactions: detectors.TOKEN_MOVEMENT_IN_CALLBACK.hooksAffected,
      unknownTargets: detectors.UNKNOWN_EXTERNAL_TARGET.hooksAffected,
      userControlled: detectors.USER_CONTROLLED_EXTERNAL_EXECUTION.hooksAffected,
      knownProtocols: detectors.PROTOCOL_INTERACTION.hooksAffected,
      detectors,
    },
    findings,
    caseStudies: selectCaseStudies(findings),
  };
}

function selectCaseStudies(findings: InteractionFindingView[]): InteractionFindingView[] {
  const preferred = [
    'TOKEN_MOVEMENT_IN_CALLBACK',
    'USER_CONTROLLED_EXTERNAL_EXECUTION',
    'PROTOCOL_INTERACTION',
    'UNKNOWN_EXTERNAL_TARGET',
  ];
  const picked: InteractionFindingView[] = [];
  for (const detector of preferred) {
    const row = findings.find((item) => item.detector === detector && (item.targetAddress || item.selector));
    if (row) picked.push(row);
  }
  return picked.slice(0, 5);
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
