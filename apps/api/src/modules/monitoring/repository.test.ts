import { describe, expect, it } from 'vitest';
import { buildMonitorSnapshot, SECURITY_EVENT_TYPES } from '@hookguard/blockchain';
import { InMemoryMonitoringRepository } from './repository.js';

describe('monitoring repository', () => {
  it('prevents duplicate unresolved events with the same fingerprint', async () => {
    const repo = new InMemoryMonitoringRepository();
    const snapshot = buildMonitorSnapshot({
      hookId: 'hook-1',
      blockNumber: 1n,
      implementationAddress: '0x2222222222222222222222222222222222222222',
      bytecodeHash: '0xaaaa',
      functions: [],
      permissions: [],
    });
    const change = {
      type: SECURITY_EVENT_TYPES.IMPLEMENTATION_CHANGED,
      severity: 'high' as const,
      confidence: 'HIGH' as const,
      title: 'impl changed',
      description: 'slot',
      evidence: {
        from: '0x2222222222222222222222222222222222222222',
        to: '0x5555555555555555555555555555555555555555',
      },
    };

    const first = await repo.commit(snapshot, [change]);
    expect(first.events).toHaveLength(1);

    const later = buildMonitorSnapshot({
      ...snapshot,
      blockNumber: 2n,
      implementationAddress: '0x5555555555555555555555555555555555555555',
    });
    const second = await repo.commit(later, [change]);
    expect(second.events).toHaveLength(0);
    expect(await repo.eventCount('hook-1')).toBe(1);
  });
});
