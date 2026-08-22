import type { FindingSeverity } from './finding.js';

export type RiskLevel = 'unknown' | 'low' | 'medium' | 'high' | 'critical';

export interface RiskScore {
  /** Integer 0–100. Higher is riskier. */
  score: number;
  level: RiskLevel;
  findingCount: number;
  highestSeverity: FindingSeverity | null;
}

export function riskLevelFromScore(score: number | null): RiskLevel {
  if (score === null || Number.isNaN(score)) {
    return 'unknown';
  }
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}
