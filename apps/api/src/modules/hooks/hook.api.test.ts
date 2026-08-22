import { getAddress } from 'viem';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import { InMemoryHookRepository } from './hook.repository.js';
import { HookService } from './hook.service.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const POOL =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;

const repository = new InMemoryHookRepository();
const app = await buildApp({ hookService: new HookService(repository) });

beforeAll(async () => {
  await repository.upsertInitialize({
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
});

afterAll(async () => {
  await app.close();
});

describe('hooks API', () => {
  it('lists indexed hooks', async () => {
    const response = await app.inject({ method: 'GET', url: '/hooks' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      total: number;
      hooks: Array<{ address: string; chainId: number; poolCount: number }>;
    };
    expect(body.total).toBe(1);
    expect(body.hooks[0]?.address.toLowerCase()).toBe(HOOK.toLowerCase());
    expect(body.hooks[0]?.poolCount).toBe(1);
    expect(body.hooks[0]).not.toHaveProperty('riskScore');
  });

  it('filters by chain', async () => {
    const empty = await app.inject({ method: 'GET', url: '/hooks?chainId=130' });
    expect(empty.json()).toMatchObject({ total: 0, hooks: [] });

    const ethereum = await app.inject({
      method: 'GET',
      url: '/hooks?chain=ethereum',
    });
    expect(ethereum.json()).toMatchObject({ total: 1 });
  });

  it('returns hook detail with pools and pending analysis', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/hooks/${HOOK}`,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      deployments: Array<{
        analysisStatus: string;
        pools: Array<{ currencyPair: string }>;
        hook: { chain: { slug: string } };
      }>;
    };
    expect(body.deployments).toHaveLength(1);
    expect(body.deployments[0]?.analysisStatus).toBe('pending');
    expect(body.deployments[0]?.pools[0]?.currencyPair).toBe('USDC/WETH');
    expect(body.deployments[0]?.hook.chain.slug).toBe('ethereum');
  });

  it('returns 404 for an unknown hook', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/hooks/0x0000000000000000000000000000000000000001',
    });
    expect(response.statusCode).toBe(404);
  });

  it('rejects an invalid address', async () => {
    const response = await app.inject({ method: 'GET', url: '/hooks/not-an-address' });
    expect(response.statusCode).toBe(400);
  });
});
