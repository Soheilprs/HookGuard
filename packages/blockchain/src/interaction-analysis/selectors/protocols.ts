export interface KnownProtocol {
  address: string;
  name: string;
  category: string;
  chainId: number;
}

/** Curated, evidence-only registry. Unknown addresses stay unclassified. */
export const KNOWN_PROTOCOLS: KnownProtocol[] = [
  {
    chainId: 1,
    address: '0x000000000004444c5dc75cb358380d2e3de08a90',
    name: 'Uniswap v4 PoolManager',
    category: 'uniswap-v4',
  },
  {
    chainId: 130,
    address: '0x1f98400000000000000000000000000000000004',
    name: 'Uniswap v4 PoolManager',
    category: 'uniswap-v4',
  },
  {
    chainId: 1,
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    name: 'WETH',
    category: 'erc20',
  },
  {
    chainId: 1,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    name: 'USDC',
    category: 'erc20',
  },
  {
    chainId: 1,
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    name: 'USDT',
    category: 'erc20',
  },
  {
    chainId: 1,
    address: '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419',
    name: 'Chainlink ETH/USD',
    category: 'chainlink',
  },
  {
    chainId: 1,
    address: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
    name: 'Aave v3 Pool',
    category: 'aave',
  },
];

const INDEX = new Map(
  KNOWN_PROTOCOLS.map((item) => [`${item.chainId}:${item.address.toLowerCase()}`, item]),
);

export function knownProtocol(chainId: number, address: string | null): KnownProtocol | null {
  if (!address) return null;
  return INDEX.get(`${chainId}:${address.toLowerCase()}`) ?? null;
}
