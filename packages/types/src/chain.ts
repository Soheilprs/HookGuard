export type ChainSlug = 'ethereum' | 'unichain';

export interface ChainNativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface ChainDefinition {
  id: number;
  slug: ChainSlug;
  name: string;
  shortName: string;
  nativeCurrency: ChainNativeCurrency;
  rpcEnvKey: string;
  defaultRpcUrl: string;
  blockExplorerUrl: string;
  blockExplorerName: string;
  /** Uniswap v4 PoolManager singleton for this chain. */
  poolManager: `0x${string}`;
}
