import type { AnalysisInput } from '../../analysis/types.js';
import type { FunctionCandidate } from '../analysis/functions.js';
import {
  CALLBACK_SELECTORS,
  callbackNameForSelector,
  flaggedLifecycleCallbacks,
  type BytecodeLifecycleCallback,
} from './lifecycle-map.js';

export interface CallbackEntry {
  callback: BytecodeLifecycleCallback;
  selector: string;
  entryPc: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  source: 'DISPATCHER' | 'ABI' | 'FLAG_AND_DISPATCHER';
}

export function resolveCallbackEntries(
  input: AnalysisInput,
  functions: FunctionCandidate[],
): CallbackEntry[] {
  const bySelector = new Map(functions.map((item) => [item.selector.toLowerCase(), item]));
  const flagged = new Set(flaggedLifecycleCallbacks(input.hookAddress));
  const entries: CallbackEntry[] = [];

  for (const spec of CALLBACK_SELECTORS) {
    const recovered = bySelector.get(spec.selector);
    const abi = input.functions.find(
      (fn) =>
        fn.selector.toLowerCase() === spec.selector ||
        fn.name.toLowerCase() === spec.name.toLowerCase(),
    );
    if (!recovered) continue;
    const flaggedOn = flagged.size === 0 || flagged.has(spec.name);
    if (!flaggedOn && !abi) continue;
    entries.push({
      callback: spec.name,
      selector: spec.selector,
      entryPc: recovered.entryPoint,
      confidence: recovered.confidence,
      source: flagged.has(spec.name) ? 'FLAG_AND_DISPATCHER' : abi ? 'ABI' : 'DISPATCHER',
    });
  }

  return uniqueByCallback(entries);
}

function uniqueByCallback(entries: CallbackEntry[]): CallbackEntry[] {
  const map = new Map<string, CallbackEntry>();
  for (const entry of entries) {
    const existing = map.get(entry.callback);
    if (!existing || existing.entryPc > entry.entryPc) map.set(entry.callback, entry);
  }
  return [...map.values()];
}

void callbackNameForSelector;
