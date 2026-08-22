import type { Finding, RiskScore } from '@hookguard/types';

export interface ScoreRequest {
  hookId: string;
  findings: Finding[];
}

/**
 * Maps structured hook findings to a 0–100 risk score.
 *
 * Scoring is deterministic. HookGuard is not an AI auditor —
 * the engine applies published, reviewable rules.
 *
 * Phase 0: interface only.
 */
export interface RiskEngine {
  score(request: ScoreRequest): Promise<RiskScore>;
}
