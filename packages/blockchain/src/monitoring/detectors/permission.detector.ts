import { PRIVILEGED_FUNCTIONS } from '../../analysis/rules/permissions.rules.js';
import { privilegedMutators } from '../../analysis/privileged.js';
import type { AnalysisFunction } from '../../analysis/types.js';
import type {
  MonitorSnapshot,
  SecurityChange,
  SnapshotFunction,
  SnapshotPermission,
} from '../changes.js';
import { SECURITY_EVENT_TYPES } from '../changes.js';

const PRIVILEGED_SELECTORS = new Set(
  PRIVILEGED_FUNCTIONS.map((item) => item.selector.toLowerCase()),
);

const COVERED_PERMISSION_TYPES = new Set(['owner', 'proxy_admin']);

function asAnalysisFunctions(functions: SnapshotFunction[]): AnalysisFunction[] {
  return functions.map((fn) => ({
    name: fn.name,
    selector: fn.selector,
    visibility: fn.visibility,
    stateMutability: fn.stateMutability,
  }));
}

export function privilegedEntries(functions: SnapshotFunction[]): SnapshotFunction[] {
  const named = new Set(
    privilegedMutators(asAnalysisFunctions(functions)).map((fn) => fn.selector.toLowerCase()),
  );
  return functions.filter((fn) => {
    const selector = fn.selector.toLowerCase();
    if (PRIVILEGED_SELECTORS.has(selector)) return true;
    if (named.has(selector)) return true;
    return false;
  });
}

function permissionKey(permission: SnapshotPermission): string {
  return `${permission.type.toLowerCase()}:${permission.address.toLowerCase()}`;
}

export function detectPermissionChanges(
  previous: MonitorSnapshot,
  current: MonitorSnapshot,
): SecurityChange[] {
  const events: SecurityChange[] = [];

  const previousKeys = new Set(previous.permissions.map(permissionKey));
  const currentKeys = new Set(current.permissions.map(permissionKey));
  const added = current.permissions.filter(
    (permission) =>
      !previousKeys.has(permissionKey(permission)) &&
      !COVERED_PERMISSION_TYPES.has(permission.type.toLowerCase()),
  );
  const removed = previous.permissions.filter(
    (permission) =>
      !currentKeys.has(permissionKey(permission)) &&
      !COVERED_PERMISSION_TYPES.has(permission.type.toLowerCase()),
  );

  if (added.length > 0 || removed.length > 0) {
    events.push({
      type: SECURITY_EVENT_TYPES.PERMISSION_CHANGED,
      severity: 'medium',
      confidence: 'HIGH',
      title: 'Recorded permission set changed',
      description:
        'Non-owner permission facts (roles or other recorded authorities) differ from the previous snapshot. Owner and proxy-admin changes are reported as their own event types.',
      evidence: {
        from: previous.permissionsHash,
        to: current.permissionsHash,
        previousBlock: previous.blockNumber.toString(),
        currentBlock: current.blockNumber.toString(),
        detectionSource: 'ONCHAIN_CALL',
        added: added.map((permission) => ({
          type: permission.type,
          address: permission.address,
          source: permission.source,
        })),
        removed: removed.map((permission) => ({
          type: permission.type,
          address: permission.address,
          source: permission.source,
        })),
      },
    });
  }

  const previousPrivileged = new Set(
    privilegedEntries(previous.functions).map((fn) => fn.selector.toLowerCase()),
  );
  const addedPrivileged = privilegedEntries(current.functions).filter(
    (fn) => !previousPrivileged.has(fn.selector.toLowerCase()),
  );

  if (addedPrivileged.length > 0) {
    const named = addedPrivileged.some((fn) => fn.name !== 'unknown');
    const upgrade = addedPrivileged.some((fn) => fn.name.toLowerCase().startsWith('upgrade'));
    events.push({
      type: SECURITY_EVENT_TYPES.PRIVILEGED_FUNCTION_ADDED,
      severity: upgrade ? 'high' : named ? 'medium' : 'low',
      confidence: named ? 'HIGH' : 'LOW',
      title: 'New privileged function selector appeared',
      description: named
        ? 'A privileged mutating function (fee, pause, ownership, upgrade, or setter) is present now and was not in the previous snapshot.'
        : 'A selector matching a known privileged function appeared in bytecode. The name was not recovered, so confidence is low.',
      evidence: {
        from: previous.functionsHash,
        to: current.functionsHash,
        previousBlock: previous.blockNumber.toString(),
        currentBlock: current.blockNumber.toString(),
        detectionSource: named ? 'VERIFIED_ABI' : 'BYTECODE_SELECTOR',
        added: addedPrivileged.map((fn) => ({
          name: fn.name,
          selector: fn.selector,
        })),
      },
    });
  }

  return events;
}
