import {
  currencyPairLabel,
  decodeInitializeLogs,
  getChainById,
  isZeroAddress,
  nextBlockRange,
  resumeBlock,
  type InitializeLogFetcher,
  type TokenMetadataProvider,
} from '@hookguard/blockchain';
import type { HookRepository } from './hook.repository.js';

export interface IndexerRunOptions {
  chainId: number;
  fetcher: InitializeLogFetcher;
  tokens: TokenMetadataProvider;
  repository: HookRepository;
  startBlock?: bigint;
  batchSize?: bigint;
  maxBlocks?: bigint;
  confirmations?: bigint;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

export interface IndexerRunResult {
  chainId: number;
  fromBlock: bigint;
  lastProcessedBlock: bigint;
  initializeLogs: number;
  hookedPools: number;
  createdHooks: number;
  createdPools: number;
  skippedNoHook: number;
}

const DEFAULT_BATCH = 2_000n;

export async function runHookDiscovery(
  options: IndexerRunOptions,
): Promise<IndexerRunResult> {
  const chain = getChainById(options.chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${options.chainId}`);
  }

  const log = options.logger ?? console;
  const batchSize = options.batchSize ?? DEFAULT_BATCH;
  const confirmations = options.confirmations ?? 0n;
  const poolManager = chain.poolManager;

  const checkpoint = await options.repository.getCheckpoint(
    options.chainId,
    poolManager,
  );
  const configuredStart = options.startBlock ?? chain.poolManagerStartBlock;
  let cursor = resumeBlock(
    checkpoint?.lastProcessedBlock ?? null,
    configuredStart,
  );

  const latest = await options.fetcher.getLatestBlock();
  const target = latest > confirmations ? latest - confirmations : 0n;
  const cap =
    options.maxBlocks !== undefined ? cursor + options.maxBlocks - 1n : target;
  const end = cap < target ? cap : target;

  const result: IndexerRunResult = {
    chainId: options.chainId,
    fromBlock: cursor,
    lastProcessedBlock: checkpoint?.lastProcessedBlock ?? configuredStart - 1n,
    initializeLogs: 0,
    hookedPools: 0,
    createdHooks: 0,
    createdPools: 0,
    skippedNoHook: 0,
  };

  if (cursor > end) {
    log.info(
      `[indexer] ${chain.slug} already caught up at block ${result.lastProcessedBlock}`,
    );
    return result;
  }

  log.info(
    `[indexer] ${chain.slug} scanning ${cursor} → ${end} (batch ${batchSize})`,
  );

  while (true) {
    const range = nextBlockRange(cursor, end, batchSize);
    if (!range) break;

    const logs = await options.fetcher.getInitializeLogs(range);
    const decoded = decodeInitializeLogs(logs);
    result.initializeLogs += decoded.length;

    for (const event of decoded) {
      if (!event.hasHook || isZeroAddress(event.hooks)) {
        result.skippedNoHook += 1;
        continue;
      }

      const token0Symbol = await options.tokens.getSymbol(
        options.chainId,
        event.currency0,
      );
      const token1Symbol = await options.tokens.getSymbol(
        options.chainId,
        event.currency1,
      );

      const upsert = await options.repository.upsertInitialize({
        chainId: options.chainId,
        blockNumber: event.blockNumber,
        poolId: event.poolId,
        hookAddress: event.hooks,
        token0: event.currency0,
        token1: event.currency1,
        token0Symbol,
        token1Symbol,
        currencyPair: currencyPairLabel(token0Symbol, token1Symbol),
        fee: event.fee,
        tickSpacing: event.tickSpacing,
      });

      result.hookedPools += 1;
      if (upsert.createdHook) result.createdHooks += 1;
      if (upsert.createdPool) result.createdPools += 1;
    }

    await options.repository.saveCheckpoint(
      options.chainId,
      poolManager,
      range.toBlock,
    );
    result.lastProcessedBlock = range.toBlock;
    cursor = range.toBlock + 1n;
  }

  log.info(
    `[indexer] ${chain.slug} done. logs=${result.initializeLogs} pools=${result.createdPools} hooks=${result.createdHooks}`,
  );

  return result;
}
