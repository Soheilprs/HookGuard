import type { AnalysisInput } from '../analysis/types.js';
import { recoverFunctionCandidates, type FunctionCandidate } from './analysis/functions.js';
import {
  callBeforeSstore,
  reachableOf,
  walkFrom,
  type OpcodeVisit,
  type ReachableOp,
} from './analysis/reachability.js';
import {
  reachableCalls,
  reachableDelegatecalls,
  reachableStaticcalls,
} from './analysis/calls.js';
import { reachableSstores } from './analysis/storage.js';
import { buildCfg } from './cfg/builder.js';
import type { ControlFlowGraph } from './cfg/graph.js';
import { disassemble, type Instruction } from './disassembler/instructions.js';
import { OP_SELFDESTRUCT } from './disassembler/opcodes.js';
import { resolveCallbackEntries, type CallbackEntry } from './hooks/callback-tracer.js';

export const BYTECODE_CFG = 'BYTECODE_CFG';

export interface CallbackReachability {
  callback: string;
  selector: string;
  entryPc: number;
  visits: OpcodeVisit[];
  delegatecall: ReachableOp[];
  call: ReachableOp[];
  staticcall: ReachableOp[];
  sstore: ReachableOp[];
  selfdestruct: ReachableOp[];
  callBeforeSstore: Array<{ callPc: number; sstorePc: number; path: number[] }>;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BytecodeProgram {
  instructions: Instruction[];
  cfg: ControlFlowGraph;
  functions: FunctionCandidate[];
  callbacks: CallbackEntry[];
  reachability: CallbackReachability[];
  opcodeDelegatecall: boolean;
  opcodeCall: boolean;
  opcodeSstore: boolean;
}

const cache = new Map<string, Omit<BytecodeProgram, 'callbacks' | 'reachability'>>();
const MAX_CACHE = 4;

export function analyzeHookBytecode(input: AnalysisInput): BytecodeProgram {
  const key = input.bytecode.toLowerCase();
  let base = cache.get(key);
  if (!base) {
    const instructions = disassemble(input.bytecode);
    const functions = recoverFunctionCandidates(instructions);
    const seeds = [0, ...functions.map((item) => item.entryPoint)];
    const cfg = buildCfg(instructions, seeds);
    base = {
      instructions,
      cfg,
      functions,
      opcodeDelegatecall: instructions.some((item) => item.name === 'DELEGATECALL'),
      opcodeCall: instructions.some((item) => item.name === 'CALL'),
      opcodeSstore: instructions.some((item) => item.name === 'SSTORE'),
    };
    if (cache.size >= MAX_CACHE) {
      const first = cache.keys().next().value;
      if (first) cache.delete(first);
    }
    cache.set(key, base);
  }
  const callbacks = resolveCallbackEntries(input, base.functions);
  return {
    ...base,
    callbacks,
    reachability: callbacks.map((entry) => {
      const visits = walkFrom(base.cfg, entry.entryPc);
      const fullyResolved = base.cfg.unresolvedJumps === 0;
      return {
        callback: entry.callback,
        selector: entry.selector,
        entryPc: entry.entryPc,
        visits,
        delegatecall: reachableDelegatecalls(visits),
        call: reachableCalls(visits),
        staticcall: reachableStaticcalls(visits),
        sstore: reachableSstores(visits),
        selfdestruct: reachableOf(visits, OP_SELFDESTRUCT),
        callBeforeSstore: callBeforeSstore(base.cfg, entry.entryPc),
        confidence: fullyResolved && entry.source === 'FLAG_AND_DISPATCHER' ? 'HIGH' : 'MEDIUM',
      };
    }),
  };
}

export function clearBytecodeAnalysisCache(): void {
  cache.clear();
}
