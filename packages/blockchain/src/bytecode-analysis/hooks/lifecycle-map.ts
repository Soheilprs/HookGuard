import { toFunctionSelector } from 'viem';
import { HOOK_CALLBACKS, hookAddressFlags } from '../../analysis/rules/hooks.rules.js';

export const BYTECODE_LIFECYCLE_CALLBACKS = [
  'beforeSwap',
  'afterSwap',
  'beforeAddLiquidity',
  'afterAddLiquidity',
  'beforeRemoveLiquidity',
  'afterRemoveLiquidity',
  'beforeDonate',
  'afterDonate',
] as const;

export type BytecodeLifecycleCallback = (typeof BYTECODE_LIFECYCLE_CALLBACKS)[number];

export interface CallbackSelector {
  name: BytecodeLifecycleCallback;
  selector: string;
}

export const CALLBACK_SELECTORS: CallbackSelector[] = BYTECODE_LIFECYCLE_CALLBACKS.map(
  (name) => {
    const spec = HOOK_CALLBACKS.find((item) => item.name === name);
    if (!spec) throw new Error(`Missing IHooks spec for ${name}`);
    return {
      name,
      selector: toFunctionSelector(spec.signature).toLowerCase(),
    };
  },
);

export function callbackNameForSelector(selector: string): BytecodeLifecycleCallback | null {
  const needle = selector.toLowerCase();
  return CALLBACK_SELECTORS.find((item) => item.selector === needle)?.name ?? null;
}

export function flaggedLifecycleCallbacks(hookAddress: string): BytecodeLifecycleCallback[] {
  const flags = new Set(hookAddressFlags(hookAddress));
  return BYTECODE_LIFECYCLE_CALLBACKS.filter((name) => flags.has(name));
}
