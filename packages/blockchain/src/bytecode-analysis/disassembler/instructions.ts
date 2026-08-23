import { normalizeBytecode } from '../../contract/bytecode.js';
import {
  isPush,
  opcodeName,
  pushWidth,
} from './opcodes.js';

export interface Instruction {
  opcode: number;
  name: string;
  pc: number;
  size: number;
  pushData: Uint8Array | null;
  pushValue: bigint | null;
}

export function disassemble(bytecode: string): Instruction[] {
  const hex = normalizeBytecode(bytecode).slice(2);
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    const value = Number.parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(value)) break;
    bytes.push(value);
  }

  const instructions: Instruction[] = [];
  let pc = 0;
  while (pc < bytes.length) {
    const opcode = bytes[pc];
    if (opcode === undefined) break;
    const width = isPush(opcode) ? pushWidth(opcode) : 0;
    const data = width > 0 ? bytes.slice(pc + 1, pc + 1 + width) : [];
    const pushData = width > 0 ? Uint8Array.from(data) : opcode === 0x5f ? new Uint8Array() : null;
    let pushValue: bigint | null = null;
    if (opcode === 0x5f) pushValue = 0n;
    else if (width > 0) {
      pushValue = 0n;
      for (const byte of data) {
        pushValue = (pushValue << 8n) + BigInt(byte);
      }
    }
    const size = 1 + width;
    instructions.push({
      opcode,
      name: opcodeName(opcode),
      pc,
      size,
      pushData,
      pushValue,
    });
    pc += size;
  }
  return instructions;
}

export function instructionMap(instructions: Instruction[]): Map<number, Instruction> {
  return new Map(instructions.map((item) => [item.pc, item]));
}
