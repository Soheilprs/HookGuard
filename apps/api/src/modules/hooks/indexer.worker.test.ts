import {
  encodeAbiParameters,
  encodeEventTopics,
  getAddress,
  type Log,
} from 'viem';
import { describe, expect, it } from 'vitest';
import {
  CHAINS,
  INITIALIZE_EVENT,
  StaticTokenMetadataProvider,
  computePoolId,
  type BlockRange,
  type InitializeLogFetcher,
} from '@hookguard/blockchain';
import { InMemoryHookRepository } from './hook.repository.js';
import { runHookDiscovery } from './indexer.worker.js';

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as const;
const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const TX = ('0x' + 'cd'.repeat(32)) as `0x${string}`;

function initializeLog(params: {
  hooks: `0x${string}`;
  blockNumber: bigint;
  fee?: number;
}): Log {
  const key = {
    currency0: USDC,
    currency1: WETH,
    fee: params.fee ?? 3000,
    tickSpacing: 60,
    hooks: params.hooks,
  };
  const topics = encodeEventTopics({
    abi: [INITIALIZE_EVENT],
    eventName: 'Initialize',
    args: {
      id: computePoolId(key),
      currency0: key.currency0,
      currency1: key.currency1,
    },
  });
  const data = encodeAbiParameters(
    [
      { type: 'uint24' },
      { type: 'int24' },
      { type: 'address' },
      { type: 'uint160' },
      { type: 'int24' },
    ],
    [key.fee, key.tickSpacing, key.hooks, 1n, 0],
  );

  return {
    address: CHAINS.ethereum.poolManager,
    blockHash: TX,
    blockNumber: params.blockNumber,
    data,
    logIndex: 0,
    removed: false,
    topics,
    transactionHash: TX,
    transactionIndex: 0,
  } as Log;
}

class FakeFetcher implements InitializeLogFetcher {
  constructor(
    private readonly logs: Log[],
    private readonly latest: bigint,
  ) {}

  async getLatestBlock(): Promise<bigint> {
    return this.latest;
  }

  async getInitializeLogs(range: BlockRange): Promise<Log[]> {
    return this.logs.filter((log) => {
      const block = log.blockNumber;
      if (block === null) return false;
      return block >= range.fromBlock && block <= range.toBlock;
    });
  }
}

describe('hook discovery worker', () => {
  it('indexes hooked pools and skips address(0) hooks', async () => {
    const repository = new InMemoryHookRepository();
    const logs = [
      initializeLog({ hooks: HOOK, blockNumber: 21689050n }),
      initializeLog({
        hooks: '0x0000000000000000000000000000000000000000',
        blockNumber: 21689051n,
        fee: 100,
      }),
    ];

    const result = await runHookDiscovery({
      chainId: 1,
      fetcher: new FakeFetcher(logs, 21689060n),
      tokens: new StaticTokenMetadataProvider({
        [USDC.toLowerCase()]: 'USDC',
        [WETH.toLowerCase()]: 'WETH',
      }),
      repository,
      startBlock: 21689047n,
      batchSize: 100n,
      logger: { info() {}, warn() {}, error() {} },
    });

    expect(result.initializeLogs).toBe(2);
    expect(result.skippedNoHook).toBe(1);
    expect(result.createdHooks).toBe(1);
    expect(result.createdPools).toBe(1);
    expect(await repository.countHooks()).toBe(1);
    expect(await repository.countPools()).toBe(1);

    const hooks = await repository.listHooks();
    expect(hooks[0]?.poolCount).toBe(1);
    expect(hooks[0]?.address).toBe(HOOK.toLowerCase());
  });

  it('resumes from a checkpoint and does not re-insert', async () => {
    const repository = new InMemoryHookRepository();
    const firstLog = initializeLog({ hooks: HOOK, blockNumber: 21689050n });

    await runHookDiscovery({
      chainId: 1,
      fetcher: new FakeFetcher([firstLog], 21689050n),
      tokens: new StaticTokenMetadataProvider(),
      repository,
      startBlock: 21689047n,
      batchSize: 20n,
      logger: { info() {}, warn() {}, error() {} },
    });

    const checkpoint = await repository.getCheckpoint(1, CHAINS.ethereum.poolManager);
    expect(checkpoint?.lastProcessedBlock).toBe(21689050n);

    const second = await runHookDiscovery({
      chainId: 1,
      fetcher: new FakeFetcher([firstLog], 21689050n),
      tokens: new StaticTokenMetadataProvider(),
      repository,
      startBlock: 21689047n,
      batchSize: 20n,
      logger: { info() {}, warn() {}, error() {} },
    });

    expect(second.initializeLogs).toBe(0);
    expect(await repository.countPools()).toBe(1);
  });
});
