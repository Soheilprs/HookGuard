import { parseAbiItem } from 'viem';

/**
 * Uniswap v4 PoolManager.Initialize
 * https://docs.uniswap.org/contracts/v4/reference/core/interfaces/IPoolManager
 */
export const INITIALIZE_EVENT = parseAbiItem(
  'event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)',
);

export const INITIALIZE_EVENT_NAME = 'Initialize' as const;

/** keccak256("Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)") */
export const INITIALIZE_TOPIC =
  '0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438' as const;

export const DYNAMIC_FEE_FLAG = 0x80_0000;

export function formatSwapFee(fee: number): string {
  if ((fee & DYNAMIC_FEE_FLAG) === DYNAMIC_FEE_FLAG) {
    return 'dynamic';
  }
  const percent = fee / 10_000;
  return `${percent}%`;
}
