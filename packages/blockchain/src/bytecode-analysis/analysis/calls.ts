import { OP_CALL, OP_DELEGATECALL, OP_STATICCALL } from '../disassembler/opcodes.js';
import { reachableOf, type OpcodeVisit, type ReachableOp } from './reachability.js';

export function reachableCalls(visits: OpcodeVisit[]): ReachableOp[] {
  return reachableOf(visits, OP_CALL);
}

export function reachableDelegatecalls(visits: OpcodeVisit[]): ReachableOp[] {
  return reachableOf(visits, OP_DELEGATECALL);
}

export function reachableStaticcalls(visits: OpcodeVisit[]): ReachableOp[] {
  return reachableOf(visits, OP_STATICCALL);
}
