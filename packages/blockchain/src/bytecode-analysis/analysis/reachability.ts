import {
  OP_CALL,
  OP_DELEGATECALL,
  OP_SELFDESTRUCT,
  OP_SSTORE,
  OP_STATICCALL,
} from '../disassembler/opcodes.js';
import { blockAt, type ControlFlowGraph } from '../cfg/graph.js';

export interface ReachableOp {
  opcode: number;
  name: string;
  pc: number;
  path: number[];
  pathLength: number;
  target: string | null;
}

export interface OpcodeVisit {
  pc: number;
  opcode: number;
  name: string;
  path: number[];
}

const INTERESTING = new Set([
  OP_CALL,
  OP_STATICCALL,
  OP_DELEGATECALL,
  OP_SELFDESTRUCT,
  OP_SSTORE,
]);

export function walkFrom(
  cfg: ControlFlowGraph,
  entryPc: number,
  maxNodes = 8_000,
): OpcodeVisit[] {
  const start = blockAt(cfg, entryPc);
  if (!start) return [];
  const visits: OpcodeVisit[] = [];
  const queue: Array<{ blockStart: number; path: number[] }> = [
    { blockStart: start.startPc, path: [start.startPc] },
  ];
  const seen = new Set<number>();
  let steps = 0;
  while (queue.length > 0 && steps < maxNodes) {
    const item = queue.shift();
    if (!item) break;
    if (seen.has(item.blockStart)) continue;
    seen.add(item.blockStart);
    steps += 1;
    const block = cfg.blocks.get(item.blockStart);
    if (!block) continue;
    for (const insn of block.instructions) {
      if (!INTERESTING.has(insn.opcode)) continue;
      visits.push({
        pc: insn.pc,
        opcode: insn.opcode,
        name: insn.name,
        path: item.path,
      });
    }
    for (const succ of block.successors) {
      if (!seen.has(succ)) {
        queue.push({ blockStart: succ, path: [...item.path, succ] });
      }
    }
  }
  return visits;
}

export function reachableOf(
  visits: OpcodeVisit[],
  opcode: number,
): ReachableOp[] {
  return visits
    .filter((item) => item.opcode === opcode)
    .map((item) => ({
      opcode: item.opcode,
      name: item.name,
      pc: item.pc,
      path: item.path,
      pathLength: item.path.length,
      target: null,
    }));
}

export function callBeforeSstore(
  cfg: ControlFlowGraph,
  entryPc: number,
  maxNodes = 8_000,
): Array<{ callPc: number; sstorePc: number; path: number[] }> {
  const start = blockAt(cfg, entryPc);
  if (!start) return [];
  const hits: Array<{ callPc: number; sstorePc: number; path: number[] }> = [];
  const queue: Array<{
    blockStart: number;
    path: number[];
    seenCallPc: number | null;
  }> = [{ blockStart: start.startPc, path: [start.startPc], seenCallPc: null }];
  const seen = new Set<string>();
  let steps = 0;
  while (queue.length > 0 && steps < maxNodes) {
    const item = queue.shift();
    if (!item) break;
    const key = `${item.blockStart}:${item.seenCallPc ?? 'none'}`;
    if (seen.has(key)) continue;
    seen.add(key);
    steps += 1;
    const block = cfg.blocks.get(item.blockStart);
    if (!block) continue;
    let seenCallPc = item.seenCallPc;
    for (const insn of block.instructions) {
      if (insn.opcode === OP_CALL || insn.opcode === OP_DELEGATECALL) {
        seenCallPc = insn.pc;
      }
      if (insn.opcode === OP_SSTORE && seenCallPc !== null) {
        hits.push({
          callPc: seenCallPc,
          sstorePc: insn.pc,
          path: item.path.slice(-16),
        });
      }
    }
    for (const succ of block.successors) {
      queue.push({
        blockStart: succ,
        path: item.path.length > 16 ? [...item.path.slice(-15), succ] : [...item.path, succ],
        seenCallPc,
      });
    }
  }
  return hits;
}
