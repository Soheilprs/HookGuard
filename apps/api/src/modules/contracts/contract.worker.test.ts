import { getAddress, pad } from 'viem';
import { describe, expect, it } from 'vitest';
import {
  EIP1967_IMPLEMENTATION_SLOT,
  StaticSourceProvider,
  type ReadOnlyClient,
  type VerifiedSource,
} from '@hookguard/blockchain';
import { InMemoryHookRepository } from '../hooks/hook.repository.js';
import { InMemoryContractRepository } from './contract.repository.js';
import { runContractIntelligence } from './contract.worker.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const IMPLEMENTATION = getAddress('0x2222222222222222222222222222222222222222');
const OWNER = getAddress('0x3333333333333333333333333333333333333333');

function fakeClient(): ReadOnlyClient {
  return {
    async getBlockNumber() {
      return 1n;
    },
    async getLogs() {
      return [];
    },
    async getBytecode() {
      return '0x638da5cb5b14';
    },
    async getStorageAt({ slot }) {
      if (slot === EIP1967_IMPLEMENTATION_SLOT) {
        return pad(IMPLEMENTATION, { size: 32 });
      }
      return pad('0x0', { size: 32 });
    },
    async readContract({ functionName }) {
      if (functionName === 'owner') return OWNER;
      throw new Error('missing');
    },
  };
}

describe('contract intelligence worker', () => {
  it('stores bytecode, proxy, ABI functions, and owner facts', async () => {
    const hooks = new InMemoryHookRepository();
    const contracts = new InMemoryContractRepository();
    await hooks.upsertInitialize({
      chainId: 1,
      blockNumber: 1n,
      poolId: ('0x' + '11'.repeat(32)) as `0x${string}`,
      hookAddress: HOOK,
      token0: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      token0Symbol: 'USDC',
      token1Symbol: 'WETH',
      currencyPair: 'USDC/WETH',
      fee: 3000,
      tickSpacing: 60,
    });

    const source: VerifiedSource = {
      sourceVerified: true,
      sourceUrl: 'https://repo.sourcify.dev/example',
      compilerVersion: '0.8.26',
      abi: [
        {
          type: 'function',
          name: 'owner',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ type: 'address' }],
        },
      ],
      sourceCode: 'contract Hook {}',
    };
    const sources = new Map<string, VerifiedSource>([
      [`1:${HOOK.toLowerCase()}`, source],
    ]);

    const result = await runContractIntelligence({
      chainId: 1,
      client: fakeClient(),
      sourceProvider: new StaticSourceProvider(sources),
      contracts,
      hooks,
      logger: { info() {}, warn() {}, error() {} },
    });

    expect(result.inspected).toBe(1);
    expect(result.verified).toBe(1);
    expect(result.proxies).toBe(1);

    const [record] = await contracts.getByAddress(HOOK, 1);
    expect(record?.isProxy).toBe(true);
    expect(record?.implementationAddress).toBe(IMPLEMENTATION.toLowerCase());
    expect(record?.functions.some((fn) => fn.name === 'owner')).toBe(true);
    expect(record?.permissions.some((permission) => permission.type === 'owner')).toBe(
      true,
    );
    expect((await hooks.getByAddress(HOOK, 1))[0]?.verifiedSource).toBe(true);
  });
});
