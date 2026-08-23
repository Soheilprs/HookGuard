import type { MonitorSnapshot, SecurityChange } from '../changes.js';
import { SECURITY_EVENT_TYPES } from '../changes.js';

export function detectBytecodeChanges(
  previous: MonitorSnapshot,
  current: MonitorSnapshot,
): SecurityChange[] {
  if (previous.bytecodeHash === current.bytecodeHash) return [];

  return [
    {
      type: SECURITY_EVENT_TYPES.BYTECODE_CHANGED,
      severity: 'high',
      confidence: 'HIGH',
      title: 'Runtime bytecode hash changed',
      description:
        'keccak256 of the hook address runtime bytecode differs from the previous snapshot. For a non-proxy this usually means the code at the address was replaced. For a proxy, the proxy runtime itself changed (implementation slot changes are a separate event).',
      evidence: {
        from: previous.bytecodeHash,
        to: current.bytecodeHash,
        previousBlock: previous.blockNumber.toString(),
        currentBlock: current.blockNumber.toString(),
        detectionSource: 'BYTECODE_OPCODE',
      },
    },
  ];
}
