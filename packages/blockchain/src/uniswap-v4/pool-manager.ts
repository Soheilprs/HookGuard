import { createPublicClient, http, type Address, type Log } from 'viem';
import { getChainById } from '../chains.js';
import { INITIALIZE_EVENT } from './events.js';
import {
  isRangeTooLargeError,
  splitRange,
  withRpcRetry,
  type BlockRange,
} from './ranges.js';

export type InitializeRpcLog = Pick<
  Log,
  'topics' | 'data' | 'blockNumber' | 'logIndex' | 'transactionHash'
>;

export interface InitializeLogFetcher {
  getLatestBlock(): Promise<bigint>;
  getInitializeLogs(range: BlockRange): Promise<InitializeRpcLog[]>;
}

/**
 * Minimal read-only RPC surface. Explicit so tsc can emit declarations
 * without serializing viem's PublicClient.
 */
export interface ReadOnlyClient {
  getBlockNumber(): Promise<bigint>;
  getLogs(args: {
    address: Address;
    event: typeof INITIALIZE_EVENT;
    fromBlock: bigint;
    toBlock: bigint;
    strict?: boolean;
  }): Promise<InitializeRpcLog[]>;
  readContract(args: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
  }): Promise<unknown>;
}

export function createReadOnlyClient(
  chainId: number,
  rpcUrl: string,
): ReadOnlyClient {
  const chain = getChainById(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  return createPublicClient({
    chain: {
      id: chain.id,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: { default: { http: [rpcUrl] } },
    },
    transport: http(rpcUrl, { timeout: 30_000 }),
  }) as unknown as ReadOnlyClient;
}

export function rpcUrlForSupportedChain(
  chainId: number,
  source: NodeJS.ProcessEnv = process.env,
): string {
  const chain = getChainById(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  const fromEnv = source[chain.rpcEnvKey];
  return fromEnv && fromEnv.length > 0 ? fromEnv : chain.defaultRpcUrl;
}

export class PoolManagerLogFetcher implements InitializeLogFetcher {
  constructor(
    private readonly client: ReadOnlyClient,
    private readonly poolManager: Address,
  ) {}

  async getLatestBlock(): Promise<bigint> {
    return withRpcRetry(() => this.client.getBlockNumber());
  }

  async getInitializeLogs(range: BlockRange): Promise<InitializeRpcLog[]> {
    return getLogsAdaptive(this.client, this.poolManager, range);
  }
}

async function getLogsAdaptive(
  client: ReadOnlyClient,
  poolManager: Address,
  range: BlockRange,
): Promise<InitializeRpcLog[]> {
  try {
    return await withRpcRetry(() =>
      client.getLogs({
        address: poolManager,
        event: INITIALIZE_EVENT,
        fromBlock: range.fromBlock,
        toBlock: range.toBlock,
        strict: true,
      }),
    );
  } catch (error) {
    if (!isRangeTooLargeError(error) || range.fromBlock === range.toBlock) {
      throw error;
    }
    const parts = splitRange(range);
    const collected: InitializeRpcLog[] = [];
    for (const part of parts) {
      collected.push(...(await getLogsAdaptive(client, poolManager, part)));
    }
    return collected;
  }
}
