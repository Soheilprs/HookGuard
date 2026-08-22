import {
  encodeAbiParameters,
  getAddress,
  keccak256,
  type Address,
  type Hex,
} from 'viem';

export interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

/**
 * PoolId = keccak256(abi.encode(PoolKey)).
 * Matches Uniswap v4 PoolIdLibrary.toId (5 ABI words).
 */
export function computePoolId(key: PoolKey): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        {
          type: 'tuple',
          components: [
            { name: 'currency0', type: 'address' },
            { name: 'currency1', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'tickSpacing', type: 'int24' },
            { name: 'hooks', type: 'address' },
          ],
        },
      ],
      [
        {
          currency0: getAddress(key.currency0),
          currency1: getAddress(key.currency1),
          fee: key.fee,
          tickSpacing: key.tickSpacing,
          hooks: getAddress(key.hooks),
        },
      ],
    ),
  );
}
