import { describe, expect, it } from 'vitest';
import { InMemoryHookRepository } from './hook.repository.js';

const HOOK = '0x0010d0D5dB05933fa0D9f7038D365E1541a41888' as const;
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as const;
const POOL_A =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as const;
const POOL_B =
  '0x2222222222222222222222222222222222222222222222222222222222222222' as const;

function sample(
  repo: InMemoryHookRepository,
  overrides: Partial<Parameters<InMemoryHookRepository['upsertInitialize']>[0]> = {},
) {
  return repo.upsertInitialize({
    chainId: 1,
    blockNumber: 21_748_025n,
    poolId: POOL_A,
    hookAddress: HOOK,
    token0: USDC,
    token1: WETH,
    token0Symbol: 'USDC',
    token1Symbol: 'WETH',
    currencyPair: 'USDC/WETH',
    fee: 3000,
    tickSpacing: 60,
    ...overrides,
  });
}

describe('hook repository', () => {
  it('inserts a hook and pool once', async () => {
    const repo = new InMemoryHookRepository();
    const first = await sample(repo);

    expect(first.createdHook).toBe(true);
    expect(first.createdPool).toBe(true);
    expect(first.hook.poolCount).toBe(1);
    expect(await repo.countHooks()).toBe(1);
    expect(await repo.countPools()).toBe(1);
  });

  it('prevents duplicate pool inserts', async () => {
    const repo = new InMemoryHookRepository();
    await sample(repo);
    const second = await sample(repo, { blockNumber: 21_748_100n });

    expect(second.createdHook).toBe(false);
    expect(second.createdPool).toBe(false);
    expect(second.hook.poolCount).toBe(1);
    expect(second.hook.lastSeenBlock).toBe(21_748_100n);
    expect(await repo.countPools()).toBe(1);
  });

  it('counts additional pools on the same hook', async () => {
    const repo = new InMemoryHookRepository();
    await sample(repo);
    const second = await sample(repo, { poolId: POOL_B, blockNumber: 21_750_000n });

    expect(second.createdHook).toBe(false);
    expect(second.createdPool).toBe(true);
    expect(second.hook.poolCount).toBe(2);
    expect(await repo.countPools()).toBe(2);
  });

  it('filters hooks by chain', async () => {
    const repo = new InMemoryHookRepository();
    await sample(repo);
    await sample(repo, { chainId: 130, poolId: POOL_B });

    const ethereum = await repo.listHooks({ chainId: 1 });
    const unichain = await repo.listHooks({ chainId: 130 });
    expect(ethereum).toHaveLength(1);
    expect(unichain).toHaveLength(1);
    expect(unichain[0]?.chainId).toBe(130);
  });

  it('does not move a checkpoint backwards', async () => {
    const repo = new InMemoryHookRepository();
    const manager = '0x000000000004444c5dc75cB358380D2e3dE08A90';

    await repo.saveCheckpoint(1, manager, 200n);
    await repo.saveCheckpoint(1, manager, 150n);
    const checkpoint = await repo.getCheckpoint(1, manager);

    expect(checkpoint?.lastProcessedBlock).toBe(200n);
  });

  it('stores a new checkpoint and overwrites forward', async () => {
    const repo = new InMemoryHookRepository();
    const manager = '0x000000000004444c5dc75cB358380D2e3dE08A90';

    expect(await repo.getCheckpoint(1, manager)).toBeNull();
    await repo.saveCheckpoint(1, manager, 10n);
    await repo.saveCheckpoint(1, manager, 50n);
    expect((await repo.getCheckpoint(1, manager))?.lastProcessedBlock).toBe(50n);
  });
});
