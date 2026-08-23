import { toFunctionSelector } from 'viem';
import type { HookPermissionClass } from '@hookguard/types';
import type { AnalysisInput, AnalysisRule, EngineFinding } from '../types.js';
import { hasNamedAbi } from '../types.js';
import { ruleTier } from '../tiers.js';

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
    const named = hasNamedAbi(input);
    return [
      {
        ruleId: this.id,
        title: 'Uniswap v4 hook lifecycle callbacks present',
        category: 'hook-lifecycle',
        severity: 'info',
        confidence: named ? 'HIGH' : 'MEDIUM',
        detectionSource: named ? 'VERIFIED_ABI' : 'BYTECODE_SELECTOR',
        ruleTier: named ? 2 : 3,
        description:
          'ABI and/or bytecode selectors match Uniswap v4 IHooks callbacks. This lists which pool lifecycle points the hook can run at.',
        evidence: { callbacks, namedAbi: named },
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
        confidence: 'HIGH',
        detectionSource: 'HOOK_ADDRESS_FLAGS',
        ruleTier: ruleTier(this.id, 1),
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

export function classifyHookPermissions(input: AnalysisInput): {
  classification: HookPermissionClass;
  flags: string[];
  callbacks: string[];
  extraImplemented: string[];
  missingExpected: string[];
} {
  const flags = hookAddressFlags(input.hookAddress);
  const callbacks = detectedCallbacks(input).map((item) => item.name);
  const flagSet = new Set(flags);
  const callbackSet = new Set(callbacks);
  const extraImplemented = callbacks.filter((name) => !flagSet.has(name));
  const missingExpected = flags.filter((name) => !callbackSet.has(name));

  if (!hasNamedAbi(input) && !input.sourceVerified) {
    return {
      classification: 'UNKNOWN_SOURCE',
      flags,
      callbacks,
      extraImplemented,
      missingExpected,
    };
  }
  if (missingExpected.length > 0) {
    return {
      classification: 'MISSING_EXPECTED_CALLBACK',
      flags,
      callbacks,
      extraImplemented,
      missingExpected,
    };
  }
  if (extraImplemented.length > 0) {
    return {
      classification: 'EXTRA_IMPLEMENTED_CALLBACK',
      flags,
      callbacks,
      extraImplemented,
      missingExpected,
    };
  }
  return {
    classification: 'MATCH',
    flags,
    callbacks,
    extraImplemented,
    missingExpected,
  };
}

export const hooksPermissionCompareRule: AnalysisRule = {
  id: 'hooks-permission-compare',
  run(input: AnalysisInput): EngineFinding[] {
    const compared = classifyHookPermissions(input);
    if (compared.flags.length === 0 && compared.callbacks.length === 0) return [];
    const extra = compared.classification === 'EXTRA_IMPLEMENTED_CALLBACK';
    const missing = compared.classification === 'MISSING_EXPECTED_CALLBACK';
    const unknown = compared.classification === 'UNKNOWN_SOURCE';
    return [
      {
        ruleId: this.id,
        title: extra
          ? 'Implemented callback is not set in hook address flags'
          : missing
            ? 'Hook address flag has no matching implemented callback'
            : unknown
              ? 'Hook permission comparison is incomplete without verified ABI'
              : 'Hook address flags match implemented callbacks',
        category: 'hook-lifecycle',
        severity: 'info',
        confidence: unknown ? 'LOW' : 'HIGH',
        detectionSource: unknown ? 'BYTECODE_SELECTOR' : 'HOOK_ADDRESS_FLAGS',
        ruleTier: unknown ? 3 : 1,
        description: extra
          ? 'A lifecycle function appears in ABI/bytecode but the corresponding permission bit is not set on the hook address. PoolManager will not call it. This is not automatically a vulnerability.'
          : missing
            ? 'A permission bit is set on the hook address but the matching IHooks function was not found. This may be an unverified implementation or a selector mismatch.'
            : unknown
              ? 'Flags and/or selectors were observed, but without a verified ABI the comparison is incomplete.'
              : 'Enabled hook-address flags match the discovered IHooks callbacks.',
        evidence: {
          classification: compared.classification,
          flagsSet: compared.flags,
          callbacksFound: compared.callbacks,
          extraImplemented: compared.extraImplemented,
          missingExpected: compared.missingExpected,
          sourceVerified: input.sourceVerified,
        },
      },
    ];
  },
};

export const hooksRules: AnalysisRule[] = [
  hooksLifecycleRule,
  hooksAddressFlagsRule,
  hooksPermissionCompareRule,
];
