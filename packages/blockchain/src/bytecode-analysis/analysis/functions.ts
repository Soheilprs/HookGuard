import type { Instruction } from '../disassembler/instructions.js';
import { isJumpi, isPush, OP_DUP1 } from '../disassembler/opcodes.js';

export interface FunctionCandidate {
  selector: string;
  entryPoint: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Recover Solidity-style dispatcher entries: PUSH4 selector, EQ, PUSH dest, JUMPI.
 * Names are not invented; callers map known IHooks selectors.
 */
export function recoverFunctionCandidates(instructions: Instruction[]): FunctionCandidate[] {
  const found = new Map<string, FunctionCandidate>();
  for (let i = 0; i < instructions.length; i += 1) {
    const push4 = instructions[i];
    if (!push4 || push4.name !== 'PUSH4' || push4.pushValue === null) continue;
    const selector = `0x${push4.pushValue.toString(16).padStart(8, '0')}`;
    const window = instructions.slice(i + 1, i + 8);
    const eqIndex = window.findIndex((item) => item.name === 'EQ');
    if (eqIndex < 0) continue;
    const afterEq = window.slice(eqIndex + 1);
    const dest = afterEq.find((item) => isPush(item.opcode) && item.pushValue !== null);
    const jumpi = afterEq.find((item) => isJumpi(item.opcode));
    if (!dest || dest.pushValue === null || !jumpi) continue;
    const prev = instructions[i - 1];
    const confidence =
      prev && (prev.opcode === OP_DUP1 || prev.name === 'DUP1') ? 'HIGH' : 'HIGH';
    const entryPoint = Number(dest.pushValue);
    const existing = found.get(selector);
    if (!existing || existing.entryPoint > entryPoint) {
      found.set(selector, { selector, entryPoint, confidence });
    }
  }
  return [...found.values()].sort((a, b) => a.selector.localeCompare(b.selector));
}
