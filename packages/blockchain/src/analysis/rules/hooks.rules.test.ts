import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { runAnalysis } from '../engine.js';
import type { AnalysisInput } from '../types.js';
import { HOOK_CALLBACKS, hookAddressFlags, hooksRules } from './hooks.rules.js';

const AFTER_SWAP_BIT = 1 << 6;

function flaggedAddress(): `0x${string}` {
  const value = (0x1111111111111111111111111111111111111111n | BigInt(AFTER_SWAP_BIT)) as bigint;
  return getAddress(`0x${value.toString(16).padStart(40, '0')}`);
}

function input(overrides: Partial<AnalysisInput> = {}): AnalysisInput {
  return {
    hookAddress: getAddress('0x1111111111111111111111111111111111111111'),
    chainId: 1,
    bytecode: '0x60806040',
    functions: [
      {
        name: 'afterSwap',
        selector: '0xdeadbeef',
        visibility: 'external',
        stateMutability: 'nonpayable',
      },
      {
        name: 'beforeSwap',
        selector: '0xfeedbeef',
        visibility: 'external',
        stateMutability: 'nonpayable',
      },
    ],
    permissions: [],
    proxy: {
      isProxy: false,
      kind: 'none',
      implementationAddress: null,
      adminAddress: null,
    },
    codeEmpty: {},
    ...overrides,
  };
}

describe('hook lifecycle rules', () => {
  it('detects Uniswap v4 lifecycle callbacks by name', () => {
    const findings = runAnalysis(input(), hooksRules);
    const lifecycle = findings.find((finding) => finding.ruleId === 'hooks-lifecycle');
    const names = (
      lifecycle?.evidence.callbacks as Array<{ name: string }> | undefined
    )?.map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining(['afterSwap', 'beforeSwap']));
  });

  it('reads permission flags from the hook address', () => {
    const address = flaggedAddress();
    expect(hookAddressFlags(address)).toContain('afterSwap');
    const findings = runAnalysis(input({ hookAddress: address }), hooksRules);
    const flags = findings.find((finding) => finding.ruleId === 'hooks-address-flags');
    expect(flags?.evidence.flags).toEqual(expect.arrayContaining(['afterSwap']));
  });

  it('reports flag/function mismatch', () => {
    const address = flaggedAddress();
    const findings = runAnalysis(
      input({
        hookAddress: address,
        functions: [
          {
            name: 'beforeDonate',
            selector: '0x11111111',
            visibility: 'external',
            stateMutability: 'nonpayable',
          },
        ],
      }),
      hooksRules,
    );
    const mismatch = findings.find((finding) => finding.ruleId === 'hooks-flag-mismatch');
    expect(mismatch?.severity).toBe('medium');
    expect(mismatch?.evidence.flagWithoutFunction).toEqual(
      expect.arrayContaining(['afterSwap']),
    );
  });

  it('knows the canonical IHooks callback set', () => {
    expect(HOOK_CALLBACKS.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        'beforeInitialize',
        'afterInitialize',
        'beforeSwap',
        'afterSwap',
        'beforeDonate',
        'afterDonate',
        'beforeAddLiquidity',
        'afterAddLiquidity',
      ]),
    );
  });
});
