import { keccak256, type Address, type Hex } from 'viem';
import { withRpcRetry, type ReadOnlyClient } from '../uniswap-v4/index.js';

export interface BytecodeSnapshot {
  address: Address;
  bytecode: Hex;
  bytecodeHash: Hex;
  bytecodeSize: number;
  empty: boolean;
}

export async function fetchBytecode(
  client: Pick<ReadOnlyClient, 'getBytecode'>,
  address: Address,
): Promise<BytecodeSnapshot> {
  const code = (await withRpcRetry(() => client.getBytecode({ address }))) ?? '0x';
  return inspectBytecode(address, code);
}

export function inspectBytecode(address: Address, bytecode: Hex | string): BytecodeSnapshot {
  const normalized = normalizeBytecode(bytecode);
  const size = byteLength(normalized);
  return {
    address,
    bytecode: normalized,
    bytecodeHash: keccak256(normalized),
    bytecodeSize: size,
    empty: size === 0,
  };
}

export function normalizeBytecode(bytecode: string): Hex {
  if (!bytecode || bytecode === '0x' || bytecode === '0x0') {
    return '0x';
  }
  return (bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`).toLowerCase() as Hex;
}

export function byteLength(bytecode: Hex): number {
  if (bytecode === '0x') return 0;
  return Math.floor((bytecode.length - 2) / 2);
}

/**
 * Collect unique PUSH4 immediates used as jump conditions (PUSH4 + EQ / DUP1+EQ).
 * This is bytecode intelligence, not a decompiler.
 */
export function extractSelectors(bytecode: Hex | string): Hex[] {
  const hex = normalizeBytecode(bytecode).slice(2);
  if (hex.length < 10) return [];

  const found = new Set<string>();
  for (let i = 0; i + 10 <= hex.length; i += 2) {
    if (hex.slice(i, i + 2) !== '63') continue;
    const selector = hex.slice(i + 2, i + 10);
    if (selector.length !== 8) continue;
    const next = hex.slice(i + 10, i + 14);
    // PUSH4 selector EQ  or PUSH4 selector DUP1 / SWAP / EQ nearby
    if (next.startsWith('14') || next.startsWith('80') || next.startsWith('81')) {
      found.add(`0x${selector}`);
    }
  }
  return [...found].sort() as Hex[];
}

export function bytecodeContainsSelector(
  bytecode: Hex | string,
  selector: string,
): boolean {
  const needle = selector.replace(/^0x/i, '').toLowerCase();
  return normalizeBytecode(bytecode).includes(needle);
}
