import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { InMemoryContractRepository } from './contract.repository.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');

describe('contract repository', () => {
  it('persists bytecode intelligence, functions, and permissions', async () => {
    const repo = new InMemoryContractRepository();
    const saved = await repo.save({
      address: HOOK,
      chainId: 1,
      bytecode: '0x60806040',
      sourceCode: null,
      compilerVersion: '0.8.26',
      bytecodeHash: '0xabc',
      sourceVerified: true,
      sourceUrl: 'https://repo.sourcify.dev/example',
      abiJson: '[]',
      isProxy: false,
      implementationAddress: null,
      adminAddress: null,
      functions: [
        {
          name: 'owner',
          selector: '0x8da5cb5b',
          visibility: 'external',
          stateMutability: 'view',
        },
      ],
      permissions: [
        {
          type: 'owner',
          address: '0x1111111111111111111111111111111111111111',
          source: 'owner()',
        },
      ],
    });

    expect(saved.id).toBeTruthy();
    expect(saved.address).toBe(HOOK.toLowerCase());
    expect(saved.functions).toHaveLength(1);
    expect(saved.permissions[0]?.type).toBe('owner');

    const loaded = await repo.getByAddress(HOOK, 1);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.compilerVersion).toBe('0.8.26');
    expect(loaded[0]?.sourceVerified).toBe(true);
  });

  it('replaces functions on re-save instead of duplicating', async () => {
    const repo = new InMemoryContractRepository();
    await repo.save({
      address: HOOK,
      chainId: 1,
      bytecode: '0x',
      sourceCode: null,
      compilerVersion: null,
      bytecodeHash: '0x00',
      sourceVerified: false,
      sourceUrl: null,
      abiJson: null,
      isProxy: false,
      implementationAddress: null,
      adminAddress: null,
      functions: [
        {
          name: 'a',
          selector: '0x11111111',
          visibility: 'external',
          stateMutability: 'nonpayable',
        },
      ],
      permissions: [],
    });
    const second = await repo.save({
      address: HOOK,
      chainId: 1,
      bytecode: '0x',
      sourceCode: null,
      compilerVersion: null,
      bytecodeHash: '0x00',
      sourceVerified: false,
      sourceUrl: null,
      abiJson: null,
      isProxy: false,
      implementationAddress: null,
      adminAddress: null,
      functions: [
        {
          name: 'b',
          selector: '0x22222222',
          visibility: 'external',
          stateMutability: 'view',
        },
      ],
      permissions: [],
    });

    expect(second.functions).toHaveLength(1);
    expect(second.functions[0]?.name).toBe('b');
  });
});
