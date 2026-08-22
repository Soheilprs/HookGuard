import { getAddress, pad } from 'viem';
import { describe, expect, it } from 'vitest';
import {
  EIP1967_ADMIN_SLOT,
  EIP1967_IMPLEMENTATION_SLOT,
  addressFromStorage,
  detectProxy,
} from './proxy.js';

const PROXY = getAddress('0x1111111111111111111111111111111111111111');
const IMPLEMENTATION = getAddress('0x2222222222222222222222222222222222222222');
const ADMIN = getAddress('0x3333333333333333333333333333333333333333');

function slotWord(address: `0x${string}`) {
  return pad(address, { size: 32 });
}

describe('proxy detection', () => {
  it('reads an address from an EIP-1967 storage word', () => {
    expect(addressFromStorage(slotWord(IMPLEMENTATION))).toBe(IMPLEMENTATION);
    expect(addressFromStorage('0x' + '00'.repeat(32))).toBeNull();
  });

  it('detects a transparent proxy from implementation + admin slots', async () => {
    const client = {
      async getStorageAt({ slot }: { slot: `0x${string}` }) {
        if (slot === EIP1967_IMPLEMENTATION_SLOT) return slotWord(IMPLEMENTATION);
        if (slot === EIP1967_ADMIN_SLOT) return slotWord(ADMIN);
        return pad('0x0', { size: 32 });
      },
    };

    const facts = await detectProxy(client, PROXY, '0x60806040');
    expect(facts.isProxy).toBe(true);
    expect(facts.kind).toBe('transparent');
    expect(facts.implementationAddress).toBe(IMPLEMENTATION);
    expect(facts.adminAddress).toBe(ADMIN);
  });

  it('detects UUPS when the implementation slot is set and upgrade selectors exist', async () => {
    const client = {
      async getStorageAt({ slot }: { slot: `0x${string}` }) {
        if (slot === EIP1967_IMPLEMENTATION_SLOT) return slotWord(IMPLEMENTATION);
        return pad('0x0', { size: 32 });
      },
    };

    const facts = await detectProxy(client, PROXY, '0x633659cfe614');
    expect(facts.isProxy).toBe(true);
    expect(facts.kind).toBe('uups');
    expect(facts.adminAddress).toBeNull();
  });

  it('reports no proxy when slots are empty', async () => {
    const client = {
      async getStorageAt() {
        return pad('0x0', { size: 32 });
      },
    };
    const facts = await detectProxy(client, PROXY, '0x60806040');
    expect(facts.isProxy).toBe(false);
    expect(facts.kind).toBe('none');
  });
});
