import { CAPABILITY_DISCLAIMER } from '../analysis/risk/taxonomy.js';
import type { EngineFinding } from '../analysis/types.js';
import type { ReachableOp } from './analysis/reachability.js';
import { BYTECODE_CFG, type CallbackReachability } from './program.js';

export function bytecodeCfgFinding(
  partial: Omit<EngineFinding, 'detectionSource' | 'analysisType' | 'description'> & {
    description: string;
  },
): EngineFinding {
  return {
    ...partial,
    detectionSource: 'BYTECODE_OPCODE',
    analysisType: BYTECODE_CFG,
    description: `${partial.description} ${CAPABILITY_DISCLAIMER}`,
  };
}

export function pathEvidence(
  callback: string,
  entryPc: number,
  hit: ReachableOp,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    analysisType: BYTECODE_CFG,
    callback,
    entryPc,
    opcode: hit.name,
    pc: hit.pc,
    path: hit.path,
    pathLength: hit.pathLength,
    executionPath: hit.path,
    ...extra,
  };
}

export function primaryHit(
  rows: CallbackReachability[],
  pick: (row: CallbackReachability) => ReachableOp[],
): { row: CallbackReachability; hit: ReachableOp } | null {
  for (const row of rows) {
    const hit = pick(row)[0];
    if (hit) return { row, hit };
  }
  return null;
}
