import { getAddress } from 'viem';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import { InMemoryHookRepository } from '../hooks/hook.repository.js';
import { HookService } from '../hooks/hook.service.js';
import { InMemoryContractRepository } from './contract.repository.js';
import { ContractService } from './contract.service.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const POOL =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;

const hooks = new InMemoryHookRepository();
const contracts = new InMemoryContractRepository();
const app = await buildApp({
  hookService: new HookService(hooks),
  contractService: new ContractService(contracts, hooks),
});

beforeAll(async () => {
  await hooks.upsertInitialize({
    chainId: 1,
    blockNumber: 21_748_025n,
    poolId: POOL,
    hookAddress: HOOK,
    token0: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    token0Symbol: 'USDC',
    token1Symbol: 'WETH',
    currencyPair: 'USDC/WETH',
    fee: 3000,
    tickSpacing: 60,
  });
  await contracts.save({
    address: HOOK,
    chainId: 1,
    bytecode: '0x60806040',
    sourceCode: null,
    compilerVersion: '0.8.26+commit.8a97fa7a',
    bytecodeHash: '0xdead',
    sourceVerified: true,
    sourceUrl: 'https://repo.sourcify.dev/example',
    abiJson: '[]',
    isProxy: true,
    implementationAddress: '0x2222222222222222222222222222222222222222',
    adminAddress: '0x3333333333333333333333333333333333333333',
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
});

afterAll(async () => {
  await app.close();
});

describe('GET /hooks/:address/contract', () => {
  it('returns source, proxy, functions, and permissions without scores', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/hooks/${HOOK}/contract`,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      deployments: Array<{
        analysisStatus: string;
        contract: {
          compilerVersion: string;
          isProxy: boolean;
          functions: Array<{ name: string }>;
          permissions: Array<{ type: string }>;
          sourceVerified: boolean;
        };
      }>;
    };
    const deployment = body.deployments[0];
    expect(deployment?.analysisStatus).toBe('pending');
    expect(deployment?.contract.sourceVerified).toBe(true);
    expect(deployment?.contract.compilerVersion).toContain('0.8.26');
    expect(deployment?.contract.isProxy).toBe(true);
    expect(deployment?.contract.functions[0]?.name).toBe('owner');
    expect(deployment?.contract.permissions[0]?.type).toBe('owner');
    expect(JSON.stringify(body)).not.toMatch(/riskScore/);
  });

  it('returns 404 when the hook is not in the registry', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/hooks/0x0000000000000000000000000000000000000001/contract',
    });
    expect(response.statusCode).toBe(404);
  });
});
