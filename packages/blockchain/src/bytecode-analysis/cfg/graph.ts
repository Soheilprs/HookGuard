import type { BasicBlock } from './basic-block.js';

export interface ControlFlowGraph {
  blocks: Map<number, BasicBlock>;
  entryPc: number;
  jumpdests: Set<number>;
  unresolvedJumps: number;
}

export function blockAt(cfg: ControlFlowGraph, pc: number): BasicBlock | undefined {
  if (cfg.blocks.has(pc)) return cfg.blocks.get(pc);
  for (const block of cfg.blocks.values()) {
    if (pc >= block.startPc && pc <= block.endPc) return block;
  }
  return undefined;
}
