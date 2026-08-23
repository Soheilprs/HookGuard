import { HOOK_CALLBACKS, hookAddressFlags } from '../../analysis/rules/hooks.rules.js';
import { scanOpcodes } from '../../analysis/opcodes.js';
import type { AnalysisInput } from '../../analysis/types.js';
import { parseSolidityFunctions, type ParsedFunction } from '../parser/solidity.js';

/** Callbacks in scope for Phase 7A hook-path detectors. */
export const ANALYZER_LIFECYCLE_CALLBACKS = [
  'beforeSwap',
  'afterSwap',
  'beforeAddLiquidity',
  'afterAddLiquidity',
  'beforeRemoveLiquidity',
  'afterRemoveLiquidity',
] as const;

export type AnalyzerLifecycleCallback = (typeof ANALYZER_LIFECYCLE_CALLBACKS)[number];

const LIFECYCLE_SET = new Set<string>(
  ANALYZER_LIFECYCLE_CALLBACKS.map((name) => name.toLowerCase()),
);

export const SENSITIVE_FUNCTIONS = [
  'setFee',
  'setOracle',
  'setHook',
  'withdraw',
  'rescueTokens',
  'upgradeTo',
  'upgradeToAndCall',
  'pause',
] as const;

export interface HookProgram {
  source: string | null;
  sourceVerified: boolean;
  functions: ParsedFunction[];
  lifecycleFunctions: ParsedFunction[];
  flags: string[];
  bytecodeCall: boolean;
  bytecodeDelegatecall: boolean;
  namedFunctionNames: string[];
}

export function isAnalyzerLifecycle(name: string): boolean {
  return LIFECYCLE_SET.has(name.toLowerCase());
}

export function isSensitiveFunction(name: string): boolean {
  return SENSITIVE_FUNCTIONS.some((item) => item.toLowerCase() === name.toLowerCase());
}

export function buildHookProgram(input: AnalysisInput): HookProgram {
  const functions = parseSolidityFunctions(input.sourceCode);
  const callHits = scanOpcodes(input.bytecode, [0xf1, 0xf4]);
  const namedFunctionNames = input.functions
    .map((fn) => fn.name)
    .filter((name) => name && name !== 'unknown');
  return {
    source: input.sourceCode,
    sourceVerified: input.sourceVerified,
    functions,
    lifecycleFunctions: functions.filter((fn) => isAnalyzerLifecycle(fn.name)),
    flags: hookAddressFlags(input.hookAddress),
    bytecodeCall: (callHits.find((hit) => hit.opcode === 0xf1)?.pcs.length ?? 0) > 0,
    bytecodeDelegatecall: (callHits.find((hit) => hit.opcode === 0xf4)?.pcs.length ?? 0) > 0,
    namedFunctionNames,
  };
}

export function implementedLifecycleNames(program: HookProgram): string[] {
  const fromSource = program.lifecycleFunctions.map((fn) => fn.name);
  if (fromSource.length > 0) return unique(fromSource);
  return unique(
    program.namedFunctionNames.filter((name) => isAnalyzerLifecycle(name)),
  );
}

export function allImplementedCallbacks(program: HookProgram): string[] {
  const fromSource = program.functions
    .map((fn) => fn.name)
    .filter((name) => HOOK_CALLBACKS.some((spec) => spec.name.toLowerCase() === name.toLowerCase()));
  if (fromSource.length > 0) return unique(fromSource);
  return unique(
    program.namedFunctionNames.filter((name) =>
      HOOK_CALLBACKS.some((spec) => spec.name.toLowerCase() === name.toLowerCase()),
    ),
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
