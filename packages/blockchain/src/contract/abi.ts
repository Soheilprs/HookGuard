import { toFunctionSelector, type Hex } from 'viem';
import { extractSelectors } from './bytecode.js';

export interface ParsedFunction {
  name: string;
  selector: Hex;
  visibility: string;
  stateMutability: string;
}

interface AbiFunction {
  type?: string;
  name?: string;
  inputs?: Array<{ type: string; name?: string; components?: unknown[] }>;
  stateMutability?: string;
  constant?: boolean;
  payable?: boolean;
}

export function parseAbiJson(raw: unknown): AbiFunction[] {
  if (typeof raw === 'string') {
    try {
      return parseAbiJson(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is AbiFunction => {
    return Boolean(item && typeof item === 'object');
  });
}

export function functionsFromAbi(abi: unknown): ParsedFunction[] {
  const items = parseAbiJson(abi);
  const functions: ParsedFunction[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if ((item.type ?? 'function') !== 'function' || !item.name) continue;
    const stateMutability = resolveMutability(item);
    const signature = `${item.name}(${(item.inputs ?? []).map((input) => input.type).join(',')})`;
    let selector: Hex;
    try {
      selector = toFunctionSelector(`function ${signature}`);
    } catch {
      continue;
    }
    if (seen.has(selector)) continue;
    seen.add(selector);
    functions.push({
      name: item.name,
      selector,
      visibility: 'external',
      stateMutability,
    });
  }

  return functions.sort((a, b) => a.name.localeCompare(b.name));
}

export function functionsFromBytecode(bytecode: string): ParsedFunction[] {
  return extractSelectors(bytecode).map((selector) => ({
    name: 'unknown',
    selector,
    visibility: 'external',
    stateMutability: 'unknown',
  }));
}

/** Prefer ABI names; keep extra bytecode selectors as unknown. */
export function mergeFunctions(
  fromAbi: ParsedFunction[],
  fromBytecode: ParsedFunction[],
): ParsedFunction[] {
  const bySelector = new Map<string, ParsedFunction>();
  for (const fn of fromBytecode) {
    bySelector.set(fn.selector.toLowerCase(), fn);
  }
  for (const fn of fromAbi) {
    bySelector.set(fn.selector.toLowerCase(), fn);
  }
  return [...bySelector.values()].sort((a, b) => {
    if (a.name === 'unknown' && b.name !== 'unknown') return 1;
    if (b.name === 'unknown' && a.name !== 'unknown') return -1;
    return a.name.localeCompare(b.name) || a.selector.localeCompare(b.selector);
  });
}

function resolveMutability(item: AbiFunction): string {
  if (item.stateMutability) return item.stateMutability;
  if (item.constant) return 'view';
  if (item.payable) return 'payable';
  return 'nonpayable';
}
