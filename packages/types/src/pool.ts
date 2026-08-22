import type { Address } from './hook.js';

export interface Pool {
  id: string;
  /** keccak256 of the Uniswap v4 PoolKey. */
  poolId: `0x${string}`;
  chainId: number;
  hookAddress: Address;
  token0: Address;
  token1: Address;
  fee: number;
  tickSpacing: number;
  createdBlock: bigint;
  token0Address: Address;
  token1Address: Address;
  token0Symbol: string | null;
  token1Symbol: string | null;
  createdAtBlock: bigint;
  currencyPair: string;
}
