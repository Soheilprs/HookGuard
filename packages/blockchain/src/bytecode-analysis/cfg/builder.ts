import type { Instruction } from '../disassembler/instructions.js';
import {
  isJump,
  isJumpdest,
  isJumpi,
  isPush,
  isTerminal,
  OP_DUP1,
  OP_SWAP1,
  stackDelta,
} from '../disassembler/opcodes.js';
import type { BasicBlock } from './basic-block.js';
import type { ControlFlowGraph } from './graph.js';

const MAX_FRAMES = 8_000;
const MAX_INSTRUCTIONS = 8_000;

type Stack = Array<bigint | null>;

export function buildCfg(
  instructions: Instruction[],
  seeds: number[] = [0],
): ControlFlowGraph {
  if (instructions.length === 0 || instructions.length > MAX_INSTRUCTIONS) {
    return {
      blocks: new Map(),
      entryPc: 0,
      jumpdests: new Set(),
      unresolvedJumps: 0,
    };
  }
  const byPc = new Map(instructions.map((item) => [item.pc, item]));
  const jumpdests = new Set(
    instructions.filter((item) => isJumpdest(item.opcode)).map((item) => item.pc),
  );
  const leaders = new Set<number>();
  if (instructions[0]) leaders.add(instructions[0].pc);
  for (const item of instructions) {
    if (isJumpdest(item.opcode)) leaders.add(item.pc);
    if (isJump(item.opcode) || isJumpi(item.opcode) || isTerminal(item.opcode)) {
      const next = nextPc(item);
      if (byPc.has(next)) leaders.add(next);
    }
  }

  const sorted = [...leaders].sort((a, b) => a - b);
  const blocks = new Map<number, BasicBlock>();
  for (let i = 0; i < sorted.length; i += 1) {
    const start = sorted[i];
    if (start === undefined) continue;
    const endExclusive = sorted[i + 1] ?? Number.POSITIVE_INFINITY;
    const body: Instruction[] = [];
    let cursor: Instruction | undefined = byPc.get(start);
    while (cursor && cursor.pc < endExclusive) {
      body.push(cursor);
      if (isJump(cursor.opcode) || isJumpi(cursor.opcode) || isTerminal(cursor.opcode)) {
        break;
      }
      cursor = byPc.get(cursor.pc + cursor.size);
    }
    const last = body[body.length - 1];
    if (!last) continue;
    blocks.set(start, {
      startPc: start,
      endPc: last.pc,
      instructions: body,
      successors: [],
    });
  }

  const successorSet = new Map<number, Set<number>>();
  for (const start of blocks.keys()) successorSet.set(start, new Set());

  let unresolvedJumps = 0;
  const uniqueSeeds = [...new Set(seeds.filter((pc) => byPc.has(pc) || jumpdests.has(pc)))];
  const work: Array<{ pc: number; stack: Stack }> = uniqueSeeds.map((pc) => ({
    pc,
    stack: [],
  }));
  if (work.length === 0 && instructions[0]) work.push({ pc: instructions[0].pc, stack: [] });
  const seen = new Set<string>();
  let frames = 0;

  while (work.length > 0 && frames < MAX_FRAMES) {
    const frame = work.pop();
    if (!frame) break;
    const block = blocks.get(frame.pc) ?? blockContaining(blocks, frame.pc);
    if (!block) continue;
    const key = `${block.startPc}:${stackKey(frame.stack)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    frames += 1;

    const simulated = simulateBlock(block, frame.stack);
    unresolvedJumps += simulated.unresolved;
    const targets = successorSet.get(block.startPc) ?? new Set();
    for (const dest of simulated.successors) {
      if (!blocks.has(dest) && !jumpdests.has(dest)) continue;
      const start = blocks.has(dest) ? dest : (blockContaining(blocks, dest)?.startPc ?? dest);
      if (!blocks.has(start)) continue;
      targets.add(start);
      work.push({ pc: start, stack: simulated.exitStack.slice(-12) });
    }
    successorSet.set(block.startPc, targets);
  }

  for (const [start, targets] of successorSet) {
    const block = blocks.get(start);
    if (block) block.successors = [...targets].sort((a, b) => a - b);
  }

  return {
    blocks,
    entryPc: instructions[0]?.pc ?? 0,
    jumpdests,
    unresolvedJumps,
  };
}

function simulateBlock(
  block: BasicBlock,
  incoming: Stack,
): { successors: number[]; exitStack: Stack; unresolved: number } {
  let stack = incoming.slice();
  let unresolved = 0;
  const successors: number[] = [];
  for (const insn of block.instructions) {
    if (isJump(insn.opcode)) {
      const dest = pop(stack);
      if (dest === null || dest === undefined) unresolved += 1;
      else successors.push(Number(dest));
      return { successors, exitStack: stack, unresolved };
    }
    if (isJumpi(insn.opcode)) {
      const dest = pop(stack);
      pop(stack);
      const fall = insn.pc + insn.size;
      successors.push(fall);
      if (dest === null || dest === undefined) unresolved += 1;
      else successors.push(Number(dest));
      return { successors, exitStack: stack, unresolved };
    }
    if (isTerminal(insn.opcode)) {
      applyStack(stack, insn);
      return { successors, exitStack: stack, unresolved };
    }
    applyStack(stack, insn);
  }
  const last = block.instructions[block.instructions.length - 1];
  if (last) successors.push(last.pc + last.size);
  return { successors, exitStack: stack, unresolved };
}

function applyStack(stack: Stack, insn: Instruction): void {
  if (insn.pushValue !== null && isPush(insn.opcode)) {
    stack.push(insn.pushValue);
    return;
  }
  if (insn.opcode >= OP_DUP1 && insn.opcode <= 0x8f) {
    const n = insn.opcode - 0x7f;
    const item = stack[stack.length - n];
    stack.push(item === undefined ? null : item);
    return;
  }
  if (insn.opcode >= OP_SWAP1 && insn.opcode <= 0x9f) {
    const n = insn.opcode - 0x8f;
    const i = stack.length - 1;
    const j = stack.length - 1 - n;
    if (i < 0 || j < 0) return;
    const top = stack[i];
    const other = stack[j];
    stack[i] = other ?? null;
    stack[j] = top ?? null;
    return;
  }
  const { pop: pops, push } = stackDelta(insn.opcode);
  for (let i = 0; i < pops; i += 1) pop(stack);
  for (let i = 0; i < push; i += 1) stack.push(null);
}

function pop(stack: Stack): bigint | null {
  if (stack.length === 0) return null;
  return stack.pop() ?? null;
}

function nextPc(insn: Instruction): number {
  return insn.pc + insn.size;
}

function blockContaining(blocks: Map<number, BasicBlock>, pc: number): BasicBlock | undefined {
  for (const block of blocks.values()) {
    if (pc >= block.startPc && pc <= block.endPc) return block;
  }
  return undefined;
}

function stackKey(stack: Stack): string {
  if (stack.length > 16) return `${stack.length}:truncated`;
  return stack.map((item) => (item === null ? '?' : item.toString(16))).join(',');
}
