import type { ChainDefinition, ChainSlug } from '@hookguard/types';

/**
 * Canonical chain configuration for HookGuard.
 *
 * PoolManager addresses are Uniswap v4 official deployments:
 * https://docs.uniswap.org/contracts/v4/deployments
 *
 * Indexing is not implemented in Phase 0 — these values are the
 * registry the indexer and analyzer will consume later.
 */
export const CHAINS = {
  ethereum: {
    id: 1,
    slug: 'ethereum',
    name: 'Ethereum',
    shortName: 'ETH',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcEnvKey: 'RPC_URL_ETHEREUM',
    defaultRpcUrl: 'https://ethereum-rpc.publicnode.com',
    blockExplorerUrl: 'https://etherscan.io',
    blockExplorerName: 'Etherscan',
    poolManager: '0x000000000004444c5dc75cB358380D2e3dE08A90',
  },
  unichain: {
    id: 130,
    slug: 'unichain',
    name: 'Unichain',
    shortName: 'UNI',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcEnvKey: 'RPC_URL_UNICHAIN',
    defaultRpcUrl: 'https://mainnet.unichain.org',
    blockExplorerUrl: 'https://uniscan.xyz',
    blockExplorerName: 'Uniscan',
    poolManager: '0x1f98400000000000000000000000000000000004',
  },
} as const satisfies Record<ChainSlug, ChainDefinition>;

export const SUPPORTED_CHAIN_IDS = [CHAINS.ethereum.id, CHAINS.unichain.id] as const;

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

const byId = new Map<number, ChainDefinition>(
  Object.values(CHAINS).map((chain) => [chain.id, chain]),
);

const bySlug = new Map<string, ChainDefinition>(
  Object.values(CHAINS).map((chain) => [chain.slug, chain]),
);

export function getChainById(chainId: number): ChainDefinition | undefined {
  return byId.get(chainId);
}

export function getChainBySlug(slug: string): ChainDefinition | undefined {
  return bySlug.get(slug);
}

export function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return byId.has(chainId);
}

export function listSupportedChains(): ChainDefinition[] {
  return Object.values(CHAINS);
}

export function explorerAddressUrl(chainId: number, address: string): string | undefined {
  const chain = getChainById(chainId);
  if (!chain) return undefined;
  return `${chain.blockExplorerUrl}/address/${address}`;
}
