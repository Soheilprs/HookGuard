import { getAddress, keccak256 } from 'viem';
import { describe, expect, it } from 'vitest';
import {
  extractSelectors,
  fetchBytecode,
  inspectBytecode,
  normalizeBytecode,
} from './bytecode.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');

describe('bytecode intelligence', () => {
  it('hashes and sizes bytecode', () => {
    const snapshot = inspectBytecode(HOOK, '0x60806040');
    expect(snapshot.bytecodeSize).toBe(4);
    expect(snapshot.empty).toBe(false);
    expect(snapshot.bytecodeHash).toBe(keccak256('0x60806040'));
  });

  it('treats empty code as an empty contract', () => {
    expect(inspectBytecode(HOOK, '0x').empty).toBe(true);
    expect(inspectBytecode(HOOK, '0x0').bytecode).toBe('0x');
    expect(normalizeBytecode('')).toBe('0x');
  });

  it('extracts PUSH4 selectors used with EQ', () => {
    const bytecode = '0x6080604052638da5cb5b14600157' as const;
    expect(extractSelectors(bytecode)).toContain('0x8da5cb5b');
  });

  it('retrieves bytecode through the client abstraction', async () => {
    const client = {
      async getBytecode() {
        return '0x60016000' as const;
      },
    };
    const snapshot = await fetchBytecode(client, HOOK);
    expect(snapshot.bytecodeSize).toBe(4);
    expect(snapshot.bytecodeHash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
