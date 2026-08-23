import type { Instruction } from '../disassembler/instructions.js';

export interface BasicBlock {
  startPc: number;
  endPc: number;
  instructions: Instruction[];
  successors: number[];
}

export function blockContains(block: BasicBlock, pc: number): boolean {
  return pc >= block.startPc && pc <= block.endPc;
}
