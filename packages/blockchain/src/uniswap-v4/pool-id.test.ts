import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { computePoolId } from './pool-id.js';

describe('computePoolId', () => {
  it('is deterministic for a PoolKey', () => {
    const key = {
      currency0: getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
      currency1: getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
      fee: 3000,
      tickSpacing: 60,
      hooks: getAddress('0x0010d0D5dB05933fa0D9f7038D365E1541a41888'),
    };
    const first = computePoolId(key);
    const second = computePoolId(key);
    expect(first).toBe(second);
    expect(first).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
