import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeValidationMetrics, parseValidationDataset, precision } from './validation.js';

const SAMPLE = {
  version: 1,
  generatedAt: '2026-08-23',
  hooks: [
    { chainId: 1, address: '0x1111111111111111111111111111111111111111', tags: ['ethereum'] },
  ],
  reviews: [
    {
      chainId: 1,
      address: '0x1111111111111111111111111111111111111111',
      ruleId: 'proxy-used',
      status: 'CONFIRMED',
      notes: 'implementation slot matches',
    },
    {
      chainId: 1,
      address: '0x1111111111111111111111111111111111111111',
      ruleId: 'ext-call',
      status: 'NEEDS_CONTEXT',
      notes: 'opcode only',
    },
    {
      chainId: 1,
      address: '0x1111111111111111111111111111111111111111',
      ruleId: 'privileged-functions',
      status: 'FALSE_POSITIVE',
      notes: 'selector collision',
    },
  ],
};

describe('validation metrics', () => {
  it('parses a dataset and ignores NEEDS_CONTEXT in precision', () => {
    const dataset = parseValidationDataset(SAMPLE);
    const metrics = computeValidationMetrics(dataset);
    expect(metrics.confirmed).toBe(1);
    expect(metrics.falsePositive).toBe(1);
    expect(metrics.needsContext).toBe(1);
    expect(metrics.precision).toBe(0.5);
    expect(precision(10, 0)).toBe(1);
    const ext = metrics.byRule.find((row) => row.ruleId === 'ext-call');
    expect(ext?.precision).toBeNull();
  });

  it('parses the real validation dataset', () => {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), 'data/validation/dataset.json'), 'utf8'),
    ) as unknown;
    const dataset = parseValidationDataset(raw);
    expect(dataset.hooks.length).toBeGreaterThanOrEqual(20);
    const metrics = computeValidationMetrics(dataset);
    expect(metrics.totalReviewedFindings).toBe(135);
    expect(metrics.confirmed).toBe(80);
    expect(metrics.falsePositive).toBe(0);
    expect(metrics.needsContext).toBe(55);
    expect(metrics.precision).toBe(1);
    expect(metrics.byRule.some((row) => row.ruleId === 'ext-call' && row.needsContext > 0)).toBe(
      true,
    );
  });
});
