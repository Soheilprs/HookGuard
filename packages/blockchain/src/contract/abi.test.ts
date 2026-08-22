import { toFunctionSelector } from 'viem';
import { describe, expect, it } from 'vitest';
import { functionsFromAbi, functionsFromBytecode, mergeFunctions } from './abi.js';

const ownerAbi = [
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  { type: 'event', name: 'Transfer' },
];

describe('ABI parsing', () => {
  it('extracts function names, selectors, and mutability', () => {
    const functions = functionsFromAbi(ownerAbi);
    const owner = functions.find((fn) => fn.name === 'owner');
    const transfer = functions.find((fn) => fn.name === 'transfer');

    expect(owner?.selector).toBe(toFunctionSelector('function owner()'));
    expect(owner?.stateMutability).toBe('view');
    expect(owner?.visibility).toBe('external');
    expect(transfer?.selector).toBe(
      toFunctionSelector('function transfer(address,uint256)'),
    );
    expect(functions.some((fn) => fn.name === 'Transfer')).toBe(false);
  });

  it('falls back to bytecode selectors without names', () => {
    const functions = functionsFromBytecode('0x638da5cb5b14');
    expect(functions[0]?.name).toBe('unknown');
    expect(functions[0]?.selector).toBe('0x8da5cb5b');
  });

  it('prefers ABI names when merging', () => {
    const merged = mergeFunctions(
      functionsFromAbi(ownerAbi),
      functionsFromBytecode('0x638da5cb5b14'),
    );
    const owner = merged.find((fn) => fn.selector === '0x8da5cb5b');
    expect(owner?.name).toBe('owner');
  });
});
