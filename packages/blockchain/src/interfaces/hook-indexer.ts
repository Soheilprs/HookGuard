import type { Address, Hook } from '@hookguard/types';

/**
 * Discovers Uniswap v4 hooks on a chain by observing PoolManager events
 * and related deployment traces.
 *
 * Phase 0: interface only. Real indexing lands in a later phase.
 */
export interface HookIndexer {
  readonly chainId: number;

  /** Begin watching the chain from `fromBlock` (inclusive). */
  start(fromBlock?: bigint): Promise<void>;

  /** Stop watching and flush any in-flight work. */
  stop(): Promise<void>;

  /** Look up a previously indexed hook. */
  getHook(address: Address): Promise<Hook | null>;

  /** Number of hooks persisted for this chain. */
  getIndexedHookCount(): Promise<number>;
}

export interface HookIndexerFactory {
  create(chainId: number): HookIndexer;
}
