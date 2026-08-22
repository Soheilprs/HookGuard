import { describe, expect, it } from 'vitest';
import {
  CHAINS,
  getChainById,
  getChainBySlug,
  isSupportedChainId,
  listSupportedChains,
} from './chains.js';

describe('chain configuration', () => {
  it('supports Ethereum and Unichain only in Phase 0', () => {
    const chains = listSupportedChains();
    expect(chains.map((c) => c.slug).sort()).toEqual(['ethereum', 'unichain']);
    expect(CHAINS.ethereum.id).toBe(1);
    expect(CHAINS.unichain.id).toBe(130);
  });

  it('includes official Uniswap v4 PoolManager addresses', () => {
    expect(CHAINS.ethereum.poolManager).toBe(
      '0x000000000004444c5dc75cB358380D2e3dE08A90',
    );
    expect(CHAINS.unichain.poolManager).toBe(
      '0x1f98400000000000000000000000000000000004',
    );
  });

  it('resolves chains by id and slug', () => {
    expect(getChainById(1)?.slug).toBe('ethereum');
    expect(getChainBySlug('unichain')?.id).toBe(130);
    expect(isSupportedChainId(1)).toBe(true);
    expect(isSupportedChainId(10)).toBe(false);
  });

  it('declares RPC env keys without embedding secrets', () => {
    expect(CHAINS.ethereum.rpcEnvKey).toBe('RPC_URL_ETHEREUM');
    expect(CHAINS.unichain.rpcEnvKey).toBe('RPC_URL_UNICHAIN');
  });
});
