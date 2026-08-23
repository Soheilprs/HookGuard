import { normalizeBytecode } from '../contract/bytecode.js';

export interface OpcodeHit {
  opcode: number;
  name: string;
  pcs: number[];
}

const OPCODE_NAMES: Record<number, string> = {
  0xf0: 'CREATE',
  0xf1: 'CALL',
  0xf2: 'CALLCODE',
  0xf4: 'DELEGATECALL',
  0xf5: 'CREATE2',
  0xfa: 'STATICCALL',
};

/**
 * Walk runtime bytecode, skipping PUSH immediates so immediates are
 * not counted as opcodes.
 */
export function scanOpcodes(
  bytecode: string,
  wanted: number[],
): OpcodeHit[] {
  const hex = normalizeBytecode(bytecode).slice(2);
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
  }

  const wantedSet = new Set(wanted);
  const pcs = new Map<number, number[]>();

  let pc = 0;
  while (pc < bytes.length) {
    const op = bytes[pc];
    if (op === undefined) break;
    if (wantedSet.has(op)) {
      const list = pcs.get(op) ?? [];
      list.push(pc);
      pcs.set(op, list);
    }
    if (op >= 0x60 && op <= 0x7f) {
      pc += 1 + (op - 0x5f);
    } else {
      pc += 1;
    }
  }

  return wanted.map((opcode) => ({
    opcode,
    name: OPCODE_NAMES[opcode] ?? `0x${opcode.toString(16)}`,
    pcs: pcs.get(opcode) ?? [],
  }));
}
