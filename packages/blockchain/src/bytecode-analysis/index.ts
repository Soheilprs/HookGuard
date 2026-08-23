export { disassemble } from './disassembler/instructions.js';
export type { Instruction } from './disassembler/instructions.js';
export { buildCfg } from './cfg/builder.js';
export type { ControlFlowGraph } from './cfg/graph.js';
export type { BasicBlock } from './cfg/basic-block.js';
export { recoverFunctionCandidates } from './analysis/functions.js';
export type { FunctionCandidate } from './analysis/functions.js';
export {
  analyzeHookBytecode,
  bytecodeAnalysisRules,
  BYTECODE_CFG,
  BYTECODE_CFG_RULE_IDS,
  clearBytecodeAnalysisCache,
} from './engine.js';
export { CALLBACK_SELECTORS, BYTECODE_LIFECYCLE_CALLBACKS } from './hooks/lifecycle-map.js';
