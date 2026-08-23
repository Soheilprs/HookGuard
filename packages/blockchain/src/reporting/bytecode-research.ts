import { BYTECODE_CFG_RULE_IDS } from '../bytecode-analysis/engine.js';
import { findingGuidanceFor } from '../guidance/playbook.js';
import type { ReportNetwork } from './metrics.js';

export const BYTECODE_CFG_DETECTORS = [...BYTECODE_CFG_RULE_IDS] as const;

export type BytecodeCfgDetector = (typeof BYTECODE_CFG_DETECTORS)[number];

export const BYTECODE_RESEARCH_DISCLAIMER =
  'HookGuard reports security-relevant execution patterns requiring review. CFG reachability is under-approximate (unresolved jumps are not followed). These are not confirmed exploits. HookGuard does not replace a professional smart-contract audit.';

export interface BytecodeResearchFinding {
  id: string;
  detector: string;
  hookAddress: string;
  chainId: number;
  network: string;
  callback: string | null;
  opcode: string | null;
  pc: number | null;
  pathLength: number | null;
  analysisType: string | null;
  severity: string;
  confidence: string;
  evidence: Record<string, unknown>;
  whyItMatters: string;
}

export interface BytecodeResearchHook {
  id: string;
  address: string;
  chainId: number;
  analyzed: boolean;
  opcodeDelegatecall: boolean;
  opcodeCall: boolean;
  findings: BytecodeResearchFinding[];
}

export interface BytecodeResearchCorpus {
  generatedAt: string;
  networks: ReportNetwork[];
  hooksIndexed: number;
  hooks: BytecodeResearchHook[];
}

export interface BytecodeResearchMetrics {
  hooksIndexed: number;
  hooksAnalyzed: number;
  opcodeDelegatecallHooks: number;
  reachableDelegatecallHooks: number;
  reachableCallHooks: number;
  reachableSstoreHooks: number;
  callBeforeSstoreHooks: number;
  detectors: Record<
    BytecodeCfgDetector,
    { hooksAffected: number; findings: number; confidence: { HIGH: number; MEDIUM: number; LOW: number } }
  >;
}

export interface BytecodeResearchReport {
  generatedAt: string;
  disclaimer: string;
  metrics: BytecodeResearchMetrics;
  findings: BytecodeResearchFinding[];
}

export function buildBytecodeResearchReport(
  corpus: BytecodeResearchCorpus,
): BytecodeResearchReport {
  const analyzed = corpus.hooks.filter((hook) => hook.analyzed);
  const findings = analyzed
    .flatMap((hook) => hook.findings)
    .sort((a, b) => {
      const chain = a.chainId - b.chainId;
      if (chain !== 0) return chain;
      const addr = a.hookAddress.localeCompare(b.hookAddress);
      if (addr !== 0) return addr;
      return a.detector.localeCompare(b.detector);
    });

  const detectors = {} as BytecodeResearchReport['metrics']['detectors'];
  for (const detector of BYTECODE_CFG_DETECTORS) {
    const rows = findings.filter((item) => item.detector === detector);
    detectors[detector] = {
      hooksAffected: new Set(rows.map((item) => `${item.chainId}:${item.hookAddress}`)).size,
      findings: rows.length,
      confidence: {
        HIGH: rows.filter((item) => item.confidence.toUpperCase() === 'HIGH').length,
        MEDIUM: rows.filter((item) => item.confidence.toUpperCase() === 'MEDIUM').length,
        LOW: rows.filter((item) => item.confidence.toUpperCase() === 'LOW').length,
      },
    };
  }

  return {
    generatedAt: corpus.generatedAt,
    disclaimer: BYTECODE_RESEARCH_DISCLAIMER,
    metrics: {
      hooksIndexed: corpus.hooksIndexed,
      hooksAnalyzed: analyzed.length,
      opcodeDelegatecallHooks: analyzed.filter((hook) => hook.opcodeDelegatecall).length,
      reachableDelegatecallHooks: detectors.CALLBACK_REACHABLE_DELEGATECALL.hooksAffected,
      reachableCallHooks: detectors.CALLBACK_EXTERNAL_CALL.hooksAffected,
      reachableSstoreHooks: detectors.CALLBACK_STORAGE_MUTATION.hooksAffected,
      callBeforeSstoreHooks:
        detectors.CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE.hooksAffected,
      detectors,
    },
    findings,
  };
}

export function annotateBytecodeFinding(input: {
  id: string;
  detector: string;
  hookAddress: string;
  chainId: number;
  network: string;
  severity: string;
  confidence: string;
  evidence: Record<string, unknown>;
}): BytecodeResearchFinding {
  const guidance = findingGuidanceFor({
    category: 'EXTERNAL_EXECUTION',
    ruleId: input.detector,
  });
  return {
    ...input,
    hookAddress: input.hookAddress.toLowerCase(),
    callback: asString(input.evidence.callback),
    opcode: asString(input.evidence.opcode),
    pc: asNumber(input.evidence.pc),
    pathLength: asNumber(input.evidence.pathLength),
    analysisType: asString(input.evidence.analysisType) ?? 'BYTECODE_CFG',
    whyItMatters: guidance.guidance,
  };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}
