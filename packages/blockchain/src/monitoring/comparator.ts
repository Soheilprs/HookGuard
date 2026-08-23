import type { MonitorSnapshot, SecurityChange } from './changes.js';
import { detectBytecodeChanges } from './detectors/bytecode.detector.js';
import { detectOwnershipChanges } from './detectors/ownership.detector.js';
import { detectPermissionChanges } from './detectors/permission.detector.js';
import { detectProxyChanges } from './detectors/proxy.detector.js';

/**
 * Compare consecutive snapshots. A null previous snapshot is the baseline:
 * persist state, emit no events.
 */
export function compareSnapshots(
  previous: MonitorSnapshot | null,
  current: MonitorSnapshot,
): SecurityChange[] {
  if (!previous) return [];

  return [
    ...detectProxyChanges(previous, current),
    ...detectOwnershipChanges(previous, current),
    ...detectBytecodeChanges(previous, current),
    ...detectPermissionChanges(previous, current),
  ];
}
