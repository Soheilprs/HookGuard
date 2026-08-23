import { CAPABILITY_DISCLAIMER } from '../analysis/risk/taxonomy.js';
import type { EngineFinding } from '../analysis/types.js';
import type { ParsedFunction } from './parser/solidity.js';

export type AnalysisType = 'SOURCE' | 'BYTECODE' | 'HYBRID';

export interface AnalyzerFindingInput {
  ruleId: string;
  title: string;
  category: EngineFinding['category'];
  severity: EngineFinding['severity'];
  confidence: EngineFinding['confidence'];
  detectionSource: EngineFinding['detectionSource'];
  ruleTier: EngineFinding['ruleTier'];
  impact: string;
  affectedComponent: string;
  description: string;
  analysisType: AnalysisType;
  fn?: ParsedFunction | null;
  functionName?: string | null;
  evidence: Record<string, unknown>;
}

export function analyzerFinding(input: AnalyzerFindingInput): EngineFinding {
  const functionName = input.fn?.name ?? input.functionName ?? null;
  const sourceLocation = input.fn?.sourceLocation ?? null;
  const codeSnippet = input.fn?.snippet ?? null;
  return {
    ruleId: input.ruleId,
    title: input.title,
    category: input.category,
    severity: input.severity,
    confidence: input.confidence,
    detectionSource: input.detectionSource,
    ruleTier: input.ruleTier,
    impact: input.impact,
    affectedComponent: input.affectedComponent,
    functionName,
    sourceLocation,
    codeSnippet,
    analysisType: input.analysisType,
    description: `${input.description} ${CAPABILITY_DISCLAIMER}`,
    evidence: {
      analysisType: input.analysisType,
      functionName,
      sourceLocation,
      codeSnippet,
      ...input.evidence,
    },
  };
}
