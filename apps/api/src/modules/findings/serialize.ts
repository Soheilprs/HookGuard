import { findingGuidanceFor, ruleTier } from '@hookguard/blockchain';
import type { FindingItem } from '@hookguard/types';
import type { FindingRecord } from './finding.repository.js';

export function serializeFinding(row: FindingRecord): FindingItem {
  const attached = findingGuidanceFor({
    category: row.category,
    impact: row.impact,
    ruleId: row.ruleId,
  });
  return {
    ruleId: row.ruleId,
    title: row.title,
    category: row.category,
    severity: row.severity,
    confidence: row.confidence,
    detectionSource: row.detectionSource,
    validationStatus: row.validationStatus,
    ruleTier: ruleTier(row.ruleId),
    impact: row.impact,
    affectedComponent: row.affectedComponent,
    description: row.description,
    evidence: row.evidence,
    functionName: row.functionName,
    sourceLocation: row.sourceLocation,
    codeSnippet: row.codeSnippet,
    analysisType: row.analysisType,
    guidance: attached.guidance,
    reviewQuestions: attached.reviewQuestions,
    impactExplanation: attached.impactExplanation,
    createdAt: row.createdAt.toISOString(),
  };
}
