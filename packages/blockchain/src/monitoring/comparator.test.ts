import { describe, expect, it } from 'vitest';
import { compareSnapshots } from './comparator.js';
import type { MonitorSnapshot, SnapshotFunction } from './changes.js';
import { SECURITY_EVENT_TYPES } from './changes.js';
import { buildMonitorSnapshot } from './snapshot.js';

const UPGRADE: SnapshotFunction = {
  name: 'upgradeTo',
  selector: '0x3659cfe6',
  visibility: 'external',
  stateMutability: 'nonpayable',
};

const AFTER_SWAP: SnapshotFunction = {
  name: 'afterSwap',
  selector: '0xaaaabbbb',
  visibility: 'external',
  stateMutability: 'nonpayable',
};

function snapshot(
  overrides: Partial<Parameters<typeof buildMonitorSnapshot>[0]> = {},
): MonitorSnapshot {
  return buildMonitorSnapshot({
    hookId: 'hook-1',
    blockNumber: 100n,
    implementationAddress: '0x2222222222222222222222222222222222222222',
    adminAddress: '0x3333333333333333333333333333333333333333',
    ownerAddress: '0x4444444444444444444444444444444444444444',
    bytecodeHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    functions: [AFTER_SWAP],
    permissions: [
      {
        type: 'owner',
        address: '0x4444444444444444444444444444444444444444',
        source: 'owner()',
      },
    ],
    ...overrides,
  });
}

describe('comparison engine', () => {
  it('emits nothing for a baseline (no previous snapshot)', () => {
    expect(compareSnapshots(null, snapshot())).toEqual([]);
  });

  it('emits nothing when consecutive snapshots match', () => {
    const first = snapshot();
    const second = snapshot({ blockNumber: 200n });
    expect(compareSnapshots(first, second)).toEqual([]);
  });

  it('detects an EIP-1967 implementation change', () => {
    const previous = snapshot();
    const current = snapshot({
      blockNumber: 200n,
      implementationAddress: '0x5555555555555555555555555555555555555555',
    });
    const events = compareSnapshots(previous, current);
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe(SECURITY_EVENT_TYPES.IMPLEMENTATION_CHANGED);
    expect(events[0]?.confidence).toBe('HIGH');
    expect(events[0]?.evidence.from).toBe(previous.implementationAddress);
    expect(events[0]?.evidence.to).toBe(current.implementationAddress);
    expect(events[0]?.evidence.detectionSource).toBe('EIP1967_STORAGE');
  });

  it('detects an owner change', () => {
    const previous = snapshot();
    const current = snapshot({
      blockNumber: 201n,
      ownerAddress: '0x6666666666666666666666666666666666666666',
      permissions: [
        {
          type: 'owner',
          address: '0x6666666666666666666666666666666666666666',
          source: 'owner()',
        },
      ],
    });
    const events = compareSnapshots(previous, current);
    expect(events.some((event) => event.type === SECURITY_EVENT_TYPES.OWNERSHIP_CHANGED)).toBe(
      true,
    );
    const owner = events.find((event) => event.type === SECURITY_EVENT_TYPES.OWNERSHIP_CHANGED);
    expect(owner?.evidence.to).toBe('0x6666666666666666666666666666666666666666');
    expect(events.some((event) => event.type === SECURITY_EVENT_TYPES.PERMISSION_CHANGED)).toBe(
      false,
    );
  });

  it('detects a bytecode hash change', () => {
    const previous = snapshot();
    const current = snapshot({
      blockNumber: 202n,
      bytecodeHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
    const events = compareSnapshots(previous, current);
    expect(events.map((event) => event.type)).toEqual([SECURITY_EVENT_TYPES.BYTECODE_CHANGED]);
    expect(events[0]?.evidence.from).toBe(previous.bytecodeHash);
  });

  it('detects a new privileged function', () => {
    const previous = snapshot();
    const current = snapshot({
      blockNumber: 203n,
      functions: [AFTER_SWAP, UPGRADE],
    });
    const events = compareSnapshots(previous, current);
    const added = events.find(
      (event) => event.type === SECURITY_EVENT_TYPES.PRIVILEGED_FUNCTION_ADDED,
    );
    expect(added).toBeDefined();
    expect(added?.severity).toBe('high');
    expect(added?.evidence.added).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'upgradeTo' })]),
    );
  });

  it('detects a proxy admin change', () => {
    const previous = snapshot();
    const current = snapshot({
      blockNumber: 204n,
      adminAddress: '0x7777777777777777777777777777777777777777',
    });
    const events = compareSnapshots(previous, current);
    expect(events.map((event) => event.type)).toEqual([
      SECURITY_EVENT_TYPES.PROXY_ADMIN_CHANGED,
    ]);
  });
});
