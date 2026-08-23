import { OP_SSTORE } from '../disassembler/opcodes.js';
import { reachableOf, type OpcodeVisit, type ReachableOp } from './reachability.js';

export function reachableSstores(visits: OpcodeVisit[]): ReachableOp[] {
  return reachableOf(visits, OP_SSTORE);
}
