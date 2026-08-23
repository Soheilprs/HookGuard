import { toFunctionSelector } from 'viem';
import type { AnalysisInput, AnalysisRule, EngineFinding } from '../types.js';

export interface HookCallbackSpec {
  name: string;
  aliases: string[];
  flagBit: number;
  signature: string;
}

/**
 * Uniswap v4 IHooks callbacks and address flag bits
 * (Hooks.sol: BEFORE_INITIALIZE_FLAG = 1 << 13 ... last 14 bits).
 */
export const HOOK_CALLBACKS: HookCallbackSpec[] = [
  {
    name: 'beforeInitialize',
    aliases: [],
    flagBit: 13,
    signature:
      'function beforeInitialize(address,(address,address,uint24,int24,address),uint160)',
  },
  {
    name: 'afterInitialize',
    aliases: [],
    flagBit: 12,
    signature:
      'function afterInitialize(address,(address,address,uint24,int24,address),uint160,int24)',
  },
  {
    name: 'beforeAddLiquidity',
    aliases: ['beforeModifyLiquidity'],
    flagBit: 11,
    signature:
      'function beforeAddLiquidity(address,(address,address,uint24,int24,address),(int24,int24,int256,bytes32),bytes)',
  },
  {
    name: 'afterAddLiquidity',
    aliases: ['afterModifyLiquidity'],
    flagBit: 10,
    signature:
      'function afterAddLiquidity(address,(address,address,uint24,int24,address),(int24,int24,int256,bytes32),int256,int256,bytes)',
  },
  {
    name: 'beforeRemoveLiquidity',
    aliases: ['beforeModifyLiquidity'],
    flagBit: 9,
    signature:
      'function beforeRemoveLiquidity(address,(address,address,uint24,int24,address),(int24,int24,int256,bytes32),bytes)',
  },
  {
    name: 'afterRemoveLiquidity',
    aliases: ['afterModifyLiquidity'],
    flagBit: 8,
    signature:
      'function afterRemoveLiquidity(address,(address,address,uint24,int24,address),(int24,int24,int256,bytes32),int256,int256,bytes)',
  },
  {
    name: 'beforeSwap',
    aliases: [],
    flagBit: 7,
    signature:
      'function beforeSwap(address,(address,address,uint24,int24,address),(bool,int256,uint160),bytes)',
  },
  {
    name: 'afterSwap',
    aliases: [],
    flagBit: 6,
    signature:
      'function afterSwap(address,(address,address,uint24,int24,address),(bool,int256,uint160),int256,bytes)',
  },
  {
    name: 'beforeDonate',
    aliases: [],
    flagBit: 5,
    signature:
      'function beforeDonate(address,(address,address,uint24,int24,address),uint256,uint256,bytes)',
  },
  {
    name: 'afterDonate',
    aliases: [],
    flagBit: 4,
    signature:
      'function afterDonate(address,(address,address,uint24,int24,address),uint256,uint256,bytes)',
  },
];

export function hookAddressFlags(address: string): string[] {
  const bits = Number(BigInt(address) & ((1n << 14n) - 1n));
  return HOOK_CALLBACKS.filter((callback) => (bits & (1 << callback.flagBit)) !== 0).map(
    (callback) => callback.name,
  );
}

function callbackSelector(spec: HookCallbackSpec): string {
  return toFunctionSelector(spec.signature).toLowerCase();
}

function detectedCallbacks(input: AnalysisInput) {
  const names = new Set(input.functions.map((fn) => fn.name.toLowerCase()));
  const selectors = new Set(input.functions.map((fn) => fn.selector.toLowerCase()));

  return HOOK_CALLBACKS.filter((spec) => {
    if (names.has(spec.name.toLowerCase())) return true;
    if (spec.aliases.some((alias) => names.has(alias.toLowerCase()))) return true;
    if (selectors.has(callbackSelector(spec))) return true;
    return false;
  }).map((spec) => ({
    name: spec.name,
    selector: callbackSelector(spec),
    flagBit: spec.flagBit,
  }));
}

export const hooksLifecycleRule: AnalysisRule = {
  id: 'hooks-lifecycle',
  run(input: AnalysisInput): EngineFinding[] {
    const callbacks = detectedCallbacks(input);
    if (callbacks.length === 0) return [];
    return [
      {
        ruleId: this.id,
        title: 'Uniswap v4 hook lifecycle callbacks present',
        category: 'hook-lifecycle',
        severity: 'info',
        description:
          'ABI and/or bytecode selectors match Uniswap v4 IHooks callbacks. This lists which pool lifecycle points the hook can run at.',
        evidence: { callbacks },
      },
    ];
  },
};

export const hooksAddressFlagsRule: AnalysisRule = {
  id: 'hooks-address-flags',
  run(input: AnalysisInput): EngineFinding[] {
    const flags = hookAddressFlags(input.hookAddress);
    if (flags.length === 0) return [];
    return [
      {
        ruleId: this.id,
        title: 'Hook address permission flags are set',
        category: 'hook-lifecycle',
        severity: 'info',
        description:
          'Uniswap v4 encodes enabled callbacks in the low 14 bits of the hook address. Those bits are set on this address.',
        evidence: {
          address: input.hookAddress,
          flags,
          flagBits: Number(BigInt(input.hookAddress) & ((1n << 14n) - 1n)),
        },
      },
    ];
  },
};

export const hooksFlagMismatchRule: AnalysisRule = {
  id: 'hooks-flag-mismatch',
  run(input: AnalysisInput): EngineFinding[] {
    const flags = new Set(hookAddressFlags(input.hookAddress));
    const callbacks = new Set(detectedCallbacks(input).map((item) => item.name));
    if (flags.size === 0 || callbacks.size === 0) return [];

    const flagWithoutFn = [...flags].filter((name) => !callbacks.has(name));
    const fnWithoutFlag = [...callbacks].filter((name) => !flags.has(name));
    if (flagWithoutFn.length === 0 && fnWithoutFlag.length === 0) return [];

    return [
      {
        ruleId: this.id,
        title: 'Hook address flags do not match implemented callbacks',
        category: 'hook-lifecycle',
        severity: 'medium',
        description:
          'The permission bits encoded in the hook address differ from the IHooks functions found in ABI/bytecode.',
        evidence: {
          flagsSet: [...flags],
          callbacksFound: [...callbacks],
          flagWithoutFunction: flagWithoutFn,
          functionWithoutFlag: fnWithoutFlag,
        },
      },
    ];
  },
};

export const hooksRules: AnalysisRule[] = [
  hooksLifecycleRule,
  hooksAddressFlagsRule,
  hooksFlagMismatchRule,
];
