import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { buildMonitorSnapshot, hashFunctions, hashPermissions } from './snapshot.js';

const FN_A = {
  name: 'afterSwap',
  selector: '0xaaaabbbb',
  visibility: 'external',
  stateMutability: 'nonpayable',
};
const FN_B = {
  name: 'setFee',
  selector: '0xccccdddd',
  visibility: 'external',
  stateMutability: 'nonpayable',
};

describe('snapshot hashing', () => {
  it('hashes functions independently of order', () => {
    expect(hashFunctions([FN_A, FN_B])).toBe(hashFunctions([FN_B, FN_A]));
    expect(hashFunctions([FN_A])).not.toBe(hashFunctions([FN_B]));
  });

  it('hashes permissions independently of order', () => {
    const owner = { type: 'owner', address: '0x1111111111111111111111111111111111111111' };
    const admin = { type: 'admin', address: '0x2222222222222222222222222222222222222222' };
    expect(hashPermissions([owner, admin])).toBe(hashPermissions([admin, owner]));
  });

  it('builds a snapshot with normalized addresses and derived owner', () => {
    const snapshot = buildMonitorSnapshot({
      hookId: 'hook-1',
      blockNumber: 10n,
      implementationAddress: getAddress('0x2222222222222222222222222222222222222222'),
      adminAddress: '0x0000000000000000000000000000000000000000',
      bytecodeHash: '0xabc',
      functions: [FN_A],
      permissions: [
        {
          type: 'owner',
          address: getAddress('0x3333333333333333333333333333333333333333'),
          source: 'owner()',
        },
      ],
    });
    expect(snapshot.implementationAddress).toBe(
      '0x2222222222222222222222222222222222222222',
    );
    expect(snapshot.adminAddress).toBeNull();
    expect(snapshot.ownerAddress).toBe('0x3333333333333333333333333333333333333333');
    expect(snapshot.functionsHash.startsWith('0x')).toBe(true);
    expect(snapshot.permissionsHash.startsWith('0x')).toBe(true);
  });
});
