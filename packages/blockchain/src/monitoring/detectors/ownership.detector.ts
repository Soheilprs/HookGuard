import type { MonitorSnapshot, SecurityChange } from '../changes.js';
import { SECURITY_EVENT_TYPES } from '../changes.js';

export function detectOwnershipChanges(
  previous: MonitorSnapshot,
  current: MonitorSnapshot,
): SecurityChange[] {
  if (previous.ownerAddress === current.ownerAddress) return [];

  return [
    {
      type: SECURITY_EVENT_TYPES.OWNERSHIP_CHANGED,
      severity: 'high',
      confidence: 'HIGH',
      title: 'Hook owner() address changed',
      description:
        'owner() (or the recorded owner permission) returned a different address than the previous snapshot. This is an ownership-transfer fact.',
      evidence: {
        from: previous.ownerAddress,
        to: current.ownerAddress,
        previousBlock: previous.blockNumber.toString(),
        currentBlock: current.blockNumber.toString(),
        detectionSource: 'ONCHAIN_CALL',
        source: 'owner()',
      },
    },
  ];
}
