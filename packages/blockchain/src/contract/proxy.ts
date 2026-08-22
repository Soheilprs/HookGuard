import { getAddress, pad, sliceHex, zeroAddress, type Address, type Hex } from 'viem';
import type { ReadOnlyClient } from '../uniswap-v4/index.js';
import { bytecodeContainsSelector, normalizeBytecode } from './bytecode.js';

/** keccak256("eip1967.proxy.implementation") - 1 */
export const EIP1967_IMPLEMENTATION_SLOT =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as const;

/** keccak256("eip1967.proxy.admin") - 1 */
export const EIP1967_ADMIN_SLOT =
  '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103' as const;

const UUPS_UPGRADE_TO = '0x3659cfe6';
const UUPS_UPGRADE_TO_AND_CALL = '0x4f1ef286';

export type ProxyKind = 'none' | 'eip-1967' | 'transparent' | 'uups';

export interface ProxyFacts {
  isProxy: boolean;
  kind: ProxyKind;
  implementationAddress: Address | null;
  adminAddress: Address | null;
}

export async function detectProxy(
  client: Pick<ReadOnlyClient, 'getStorageAt'>,
  address: Address,
  bytecode: Hex | string,
): Promise<ProxyFacts> {
  const implementation = await readSlotAddress(
    client,
    address,
    EIP1967_IMPLEMENTATION_SLOT,
  );
  const admin = await readSlotAddress(client, address, EIP1967_ADMIN_SLOT);
  const code = normalizeBytecode(bytecode);
  const hasUupsSelector =
    bytecodeContainsSelector(code, UUPS_UPGRADE_TO) ||
    bytecodeContainsSelector(code, UUPS_UPGRADE_TO_AND_CALL);

  if (!implementation) {
    return {
      isProxy: false,
      kind: 'none',
      implementationAddress: null,
      adminAddress: admin,
    };
  }

  let kind: ProxyKind = 'eip-1967';
  if (admin) kind = 'transparent';
  else if (hasUupsSelector) kind = 'uups';

  return {
    isProxy: true,
    kind,
    implementationAddress: implementation,
    adminAddress: admin,
  };
}

export async function readSlotAddress(
  client: Pick<ReadOnlyClient, 'getStorageAt'>,
  address: Address,
  slot: Hex,
): Promise<Address | null> {
  const word = await client.getStorageAt({ address, slot });
  return addressFromStorage(word);
}

export function addressFromStorage(word: Hex | string | undefined): Address | null {
  if (!word || word === '0x') return null;
  const padded = pad(word as Hex, { size: 32 });
  const address = getAddress(sliceHex(padded, 12));
  if (address === zeroAddress) return null;
  return address;
}
