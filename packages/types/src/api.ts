import type { Address } from './hook.js';

export interface ChainRef {
  id: number;
  slug: string;
  name: string;
}

export interface HookListItem {
  id: string;
  address: Address;
  chainId: number;
  chain: ChainRef;
  creator: Address;
  poolCount: number;
  firstSeenBlock: string;
  lastSeenBlock: string;
  lastIndexedAt: string | null;
  verifiedSource: boolean;
}

export interface PoolListItem {
  id: string;
  poolId: `0x${string}`;
  chainId: number;
  hookAddress: Address;
  token0Address: Address;
  token1Address: Address;
  token0Symbol: string | null;
  token1Symbol: string | null;
  currencyPair: string;
  fee: number;
  tickSpacing: number;
  createdAtBlock: string;
}

export interface HookDetail {
  hook: HookListItem;
  pools: PoolListItem[];
  analysisStatus: 'pending';
}

export interface HookListResponse {
  hooks: HookListItem[];
  total: number;
}

export interface HookDetailResponse {
  deployments: HookDetail[];
}

export interface RegistryStats {
  hooksIndexed: number;
  poolsTracked: number;
  findings: number;
  averageRisk: number | null;
}
