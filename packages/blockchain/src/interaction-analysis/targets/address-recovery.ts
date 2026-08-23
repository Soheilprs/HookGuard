import type { Instruction } from '../../bytecode-analysis/disassembler/instructions.js';
import {
  isPush,
  OP_CALL,
  OP_CALLCODE,
  OP_DELEGATECALL,
  OP_DUP1,
  OP_STATICCALL,
  OP_SWAP1,
  stackDelta,
} from '../../bytecode-analysis/disassembler/opcodes.js';
import type { ControlFlowGraph } from '../../bytecode-analysis/cfg/graph.js';
import {
  sourceFromOrigin,
  toAddress,
  type ExternalCallTarget,
  type StackItem,
  type StackOrigin,
} from './call-target.js';

const OP_SLOAD = 0x54;
const OP_CALLDATALOAD = 0x35;
const OP_AND = 0x16;
const ADDRESS_MASK = (1n << 160n) - 1n;

export function recoverTargetAtCall(
  cfg: ControlFlowGraph,
  path: number[],
  callPc: number,
  opcode: number,
): { target: ExternalCallTarget; selector: string | null } {
  const insns = instructionsOnPath(cfg, path, callPc);
  const stack: StackItem[] = [];
  let lastPush4: bigint | null = null;
  for (const insn of insns) {
    if (insn.pc === callPc) break;
    if (insn.name === 'PUSH4' && insn.pushValue !== null) lastPush4 = insn.pushValue;
    apply(stack, insn);
  }
  const pops = opcode === OP_CALL || opcode === OP_CALLCODE ? 7 : 6;
  const gas = at(stack, 1);
  const addrItem = at(stack, 2);
  void gas;
  void pops;
  const origin = addrItem?.origin ?? 'UNKNOWN';
  const address = toAddress(addrItem?.value ?? null);
  const confidence: ExternalCallTarget['confidence'] =
    origin === 'CONSTANT' && address ? 'HIGH' : origin === 'CALLDATA' || origin === 'STORAGE' ? 'MEDIUM' : 'LOW';
  const selector =
    lastPush4 !== null ? `0x${lastPush4.toString(16).padStart(8, '0')}` : null;
  return {
    target: {
      address,
      source: sourceFromOrigin(origin),
      origin,
      confidence,
    },
    selector,
  };
}

function instructionsOnPath(
  cfg: ControlFlowGraph,
  path: number[],
  untilPc: number,
): Instruction[] {
  const out: Instruction[] = [];
  for (const start of path) {
    const block = cfg.blocks.get(start);
    if (!block) continue;
    for (const insn of block.instructions) {
      out.push(insn);
      if (insn.pc === untilPc) return out;
    }
  }
  return out;
}

function apply(stack: StackItem[], insn: Instruction): void {
  if (insn.pushValue !== null && isPush(insn.opcode)) {
    stack.push({ value: insn.pushValue, origin: 'CONSTANT' });
    return;
  }
  if (insn.opcode >= OP_DUP1 && insn.opcode <= 0x8f) {
    const n = insn.opcode - 0x7f;
    const item = stack[stack.length - n];
    stack.push(item ? { ...item } : { value: null, origin: 'UNKNOWN' });
    return;
  }
  if (insn.opcode >= OP_SWAP1 && insn.opcode <= 0x9f) {
    const n = insn.opcode - 0x8f;
    const i = stack.length - 1;
    const j = stack.length - 1 - n;
    if (i < 0 || j < 0) return;
    const top = stack[i];
    const other = stack[j];
    stack[i] = other ?? { value: null, origin: 'UNKNOWN' };
    stack[j] = top ?? { value: null, origin: 'UNKNOWN' };
    return;
  }
  if (insn.opcode === OP_SLOAD) {
    pop(stack);
    stack.push({ value: null, origin: 'STORAGE' });
    return;
  }
  if (insn.opcode === OP_CALLDATALOAD) {
    pop(stack);
    stack.push({ value: null, origin: 'CALLDATA' });
    return;
  }
  if (insn.opcode === OP_AND) {
    const a = pop(stack);
    const b = pop(stack);
    const origin = mergeOrigin(a.origin, b.origin);
    let value: bigint | null = null;
    if (a.value !== null && b.value !== null) value = a.value & b.value;
    if (
      (a.value === ADDRESS_MASK && b.origin === 'CALLDATA') ||
      (b.value === ADDRESS_MASK && a.origin === 'CALLDATA')
    ) {
      stack.push({ value, origin: 'CALLDATA' });
      return;
    }
    stack.push({ value, origin });
    return;
  }
  const { pop: pops, push } = stackDelta(insn.opcode);
  const popped: StackItem[] = [];
  for (let i = 0; i < pops; i += 1) popped.push(pop(stack));
  for (let i = 0; i < push; i += 1) {
    const allConst = popped.length > 0 && popped.every((item) => item.origin === 'CONSTANT' && item.value !== null);
    stack.push(
      allConst
        ? { value: null, origin: 'UNKNOWN' }
        : { value: null, origin: mergeMany(popped) },
    );
  }
}

function pop(stack: StackItem[]): StackItem {
  return stack.pop() ?? { value: null, origin: 'UNKNOWN' };
}

function at(stack: StackItem[], fromTop: number): StackItem | undefined {
  return stack[stack.length - fromTop];
}

function mergeOrigin(a: StackOrigin, b: StackOrigin): StackOrigin {
  if (a === 'CALLDATA' || b === 'CALLDATA') return 'CALLDATA';
  if (a === 'STORAGE' || b === 'STORAGE') return 'STORAGE';
  if (a === 'CONSTANT' && b === 'CONSTANT') return 'CONSTANT';
  return 'UNKNOWN';
}

function mergeMany(items: StackItem[]): StackOrigin {
  return items.reduce((acc, item) => mergeOrigin(acc, item.origin), 'CONSTANT' as StackOrigin);
}

void OP_DELEGATECALL;
void OP_STATICCALL;
void OP_CALL;
