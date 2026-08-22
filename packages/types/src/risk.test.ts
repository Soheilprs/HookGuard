import { describe, expect, it } from 'vitest';
import { riskLevelFromScore } from './risk.js';

describe('riskLevelFromScore', () => {
  it('returns unknown for null', () => {
    expect(riskLevelFromScore(null)).toBe('unknown');
  });

  it('maps score bands to levels', () => {
    expect(riskLevelFromScore(0)).toBe('low');
    expect(riskLevelFromScore(34)).toBe('low');
    expect(riskLevelFromScore(35)).toBe('medium');
    expect(riskLevelFromScore(59)).toBe('medium');
    expect(riskLevelFromScore(60)).toBe('high');
    expect(riskLevelFromScore(79)).toBe('high');
    expect(riskLevelFromScore(80)).toBe('critical');
    expect(riskLevelFromScore(100)).toBe('critical');
  });
});
