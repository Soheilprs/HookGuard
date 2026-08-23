/**
 * Published corpus from the Phase 2C validation run against real
 * Ethereum and Unichain Uniswap v4 PoolManager Initialize events.
 * Do not inflate these numbers. See docs/VALIDATION.md.
 */
export const PUBLISHED_CORPUS = {
  asOf: '2026-08-23',
  ethereumHooks: 865,
  unichainHooks: 15,
  ethereumPools: 2757,
  unichainPools: 48,
  hooks: 880,
  pools: 2805,
  inspected: 880,
  verifiedSource: 0,
  findings: 4232,
  reviewedHooks: 20,
  reviewedFindings: 135,
  confirmed: 80,
  falsePositive: 0,
  needsContext: 55,
  chains: 2,
} as const;
