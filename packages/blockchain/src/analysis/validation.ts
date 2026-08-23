import type { ValidationStatus } from '@hookguard/types';

export interface ValidationReview {
  chainId: number;
  address: string;
  ruleId: string;
  status: ValidationStatus;
  notes: string;
}

export interface ValidationHook {
  chainId: number;
  address: string;
  tags: string[];
  notes?: string;
}

export interface ValidationDataset {
  version: number;
  generatedAt: string;
  hooks: ValidationHook[];
  reviews: ValidationReview[];
}

export interface RuleQualityRow {
  ruleId: string;
  reviewed: number;
  confirmed: number;
  falsePositive: number;
  needsContext: number;
  /** confirmed / (confirmed + falsePositive). Null if none of those two. */
  precision: number | null;
}

export interface ValidationMetrics {
  hooksReviewed: number;
  totalReviewedFindings: number;
  confirmed: number;
  falsePositive: number;
  needsContext: number;
  precision: number | null;
  byRule: RuleQualityRow[];
}

export function parseValidationDataset(raw: unknown): ValidationDataset {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Validation dataset must be an object');
  }
  const value = raw as Partial<ValidationDataset>;
  if (!Array.isArray(value.hooks) || !Array.isArray(value.reviews)) {
    throw new Error('Validation dataset requires hooks[] and reviews[]');
  }
  for (const review of value.reviews) {
    if (!review.address || !review.ruleId || !review.status) {
      throw new Error('Each review needs address, ruleId, and status');
    }
    if (
      review.status !== 'CONFIRMED' &&
      review.status !== 'FALSE_POSITIVE' &&
      review.status !== 'NEEDS_CONTEXT' &&
      review.status !== 'UNREVIEWED'
    ) {
      throw new Error(`Invalid validation status: ${review.status}`);
    }
  }
  return {
    version: Number(value.version ?? 1),
    generatedAt: String(value.generatedAt ?? ''),
    hooks: value.hooks,
    reviews: value.reviews,
  };
}

export function computeValidationMetrics(dataset: ValidationDataset): ValidationMetrics {
  const reviewed = dataset.reviews.filter((row) => row.status !== 'UNREVIEWED');
  const confirmed = reviewed.filter((row) => row.status === 'CONFIRMED').length;
  const falsePositive = reviewed.filter((row) => row.status === 'FALSE_POSITIVE').length;
  const needsContext = reviewed.filter((row) => row.status === 'NEEDS_CONTEXT').length;

  const byRuleMap = new Map<string, RuleQualityRow>();
  for (const row of reviewed) {
    const current = byRuleMap.get(row.ruleId) ?? {
      ruleId: row.ruleId,
      reviewed: 0,
      confirmed: 0,
      falsePositive: 0,
      needsContext: 0,
      precision: null,
    };
    current.reviewed += 1;
    if (row.status === 'CONFIRMED') current.confirmed += 1;
    if (row.status === 'FALSE_POSITIVE') current.falsePositive += 1;
    if (row.status === 'NEEDS_CONTEXT') current.needsContext += 1;
    byRuleMap.set(row.ruleId, current);
  }

  const byRule = [...byRuleMap.values()]
    .map((row) => ({
      ...row,
      precision: precision(row.confirmed, row.falsePositive),
    }))
    .sort((a, b) => a.ruleId.localeCompare(b.ruleId));

  const uniqueHooks = new Set(
    dataset.hooks.map((hook) => `${hook.chainId}:${hook.address.toLowerCase()}`),
  );

  return {
    hooksReviewed: uniqueHooks.size,
    totalReviewedFindings: reviewed.length,
    confirmed,
    falsePositive,
    needsContext,
    precision: precision(confirmed, falsePositive),
    byRule,
  };
}

export function precision(confirmed: number, falsePositive: number): number | null {
  const denom = confirmed + falsePositive;
  if (denom === 0) return null;
  return confirmed / denom;
}
