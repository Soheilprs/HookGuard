import type { RecoveredInteraction } from './external-calls.js';

export function tokenMovements(calls: RecoveredInteraction[]): RecoveredInteraction[] {
  return calls.filter((item) => item.opcode === 'CALL' && item.erc20Movement);
}
