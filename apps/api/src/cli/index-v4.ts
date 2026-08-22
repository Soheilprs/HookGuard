import 'dotenv/config';
import {
  CHAINS,
  PoolManagerLogFetcher,
  ViemTokenMetadataProvider,
  createReadOnlyClient,
  getChainById,
  getChainBySlug,
  listSupportedChains,
  rpcUrlForSupportedChain,
  type SupportedChainId,
} from '@hookguard/blockchain';
import { PrismaHookRepository } from '../modules/hooks/hook.repository.js';
import { runHookDiscovery } from '../modules/hooks/indexer.worker.js';
import { prisma } from '../lib/prisma.js';

interface CliOptions {
  chainIds: SupportedChainId[];
  startBlocks: Map<number, bigint>;
  batchSize: bigint;
  maxBlocks?: bigint;
  confirmations: bigint;
}

function parseArgs(argv: string[], env: NodeJS.ProcessEnv): CliOptions {
  const args = new Map<string, string>();
  for (const part of argv) {
    if (!part.startsWith('--')) continue;
    const [key, raw] = part.slice(2).split('=');
    if (key) args.set(key, raw ?? 'true');
  }

  const chainArg = args.get('chain') ?? env.INDEX_CHAIN;
  const chainIds: SupportedChainId[] = chainArg
    ? [resolveChainId(chainArg)]
    : listSupportedChains().map((chain) => chain.id as SupportedChainId);

  const startBlocks = new Map<number, bigint>();
  const globalStart = args.get('from-block') ?? env.INDEX_FROM_BLOCK;
  if (globalStart) {
    for (const id of chainIds) {
      startBlocks.set(id, BigInt(globalStart));
    }
  }
  if (env.INDEX_START_BLOCK_ETHEREUM) {
    startBlocks.set(CHAINS.ethereum.id, BigInt(env.INDEX_START_BLOCK_ETHEREUM));
  }
  if (env.INDEX_START_BLOCK_UNICHAIN) {
    startBlocks.set(CHAINS.unichain.id, BigInt(env.INDEX_START_BLOCK_UNICHAIN));
  }

  const batchSize = BigInt(
    args.get('batch-size') ?? env.INDEX_BATCH_SIZE ?? '2000',
  );
  const maxBlocksRaw = args.get('max-blocks') ?? env.INDEX_MAX_BLOCKS;
  const confirmations = BigInt(
    args.get('confirmations') ?? env.INDEX_CONFIRMATIONS ?? '0',
  );

  return {
    chainIds,
    startBlocks,
    batchSize,
    maxBlocks: maxBlocksRaw ? BigInt(maxBlocksRaw) : undefined,
    confirmations,
  };
}

function resolveChainId(value: string): SupportedChainId {
  if (/^\d+$/.test(value)) {
    const id = Number(value);
    const chain = getChainById(id);
    if (!chain) {
      throw new Error(`Unsupported chain id: ${value}`);
    }
    return chain.id as SupportedChainId;
  }
  const chain = getChainBySlug(value);
  if (!chain) {
    throw new Error(`Unknown chain: ${value}`);
  }
  return chain.id as SupportedChainId;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2), process.env);
  const repository = new PrismaHookRepository(prisma);
  const clients = new Map(
    options.chainIds.map((chainId) => {
      const url = rpcUrlForSupportedChain(chainId);
      return [chainId, createReadOnlyClient(chainId, url)] as const;
    }),
  );
  const tokens = new ViemTokenMetadataProvider(clients);

  console.info('HookGuard v4 discovery (read-only, no signing)');

  for (const chainId of options.chainIds) {
    const chain = getChainById(chainId);
    if (!chain) continue;
    const client = clients.get(chainId);
    if (!client) continue;

    const fetcher = new PoolManagerLogFetcher(client, chain.poolManager);
    await runHookDiscovery({
      chainId,
      fetcher,
      tokens,
      repository,
      startBlock: options.startBlocks.get(chainId),
      batchSize: options.batchSize,
      maxBlocks: options.maxBlocks,
      confirmations: options.confirmations,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
