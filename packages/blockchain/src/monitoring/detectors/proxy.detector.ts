import type { MonitorSnapshot, SecurityChange } from '../changes.js';
import { SECURITY_EVENT_TYPES } from '../changes.js';

function slotEvidence(
  previous: MonitorSnapshot,
  current: MonitorSnapshot,
  from: string | null,
  to: string | null,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return {
    from,
    to,
    previousBlock: previous.blockNumber.toString(),
    currentBlock: current.blockNumber.toString(),
    detectionSource: 'EIP1967_STORAGE',
    ...extra,
  };
}

export function detectProxyChanges(
  previous: MonitorSnapshot,
  current: MonitorSnapshot,
): SecurityChange[] {
  const events: SecurityChange[] = [];

  if (previous.implementationAddress !== current.implementationAddress) {
    events.push({
      type: SECURITY_EVENT_TYPES.IMPLEMENTATION_CHANGED,
      severity: 'high',
      confidence: 'HIGH',
      title: 'EIP-1967 implementation address changed',
      description:
        'The EIP-1967 implementation storage slot now holds a different address than the previous snapshot. This is an observed upgrade of the proxy target, not an exploit proof.',
      evidence: slotEvidence(
        previous,
        current,
        previous.implementationAddress,
        current.implementationAddress,
        { slot: 'eip1967.proxy.implementation' },
      ),
    });
  }

  if (previous.adminAddress !== current.adminAddress) {
    events.push({
      type: SECURITY_EVENT_TYPES.PROXY_ADMIN_CHANGED,
      severity: 'high',
      confidence: 'HIGH',
      title: 'EIP-1967 proxy admin address changed',
      description:
        'The EIP-1967 admin storage slot now holds a different address than the previous snapshot.',
      evidence: slotEvidence(
        previous,
        current,
        previous.adminAddress,
        current.adminAddress,
        { slot: 'eip1967.proxy.admin' },
      ),
    });
  }

  return events;
}
