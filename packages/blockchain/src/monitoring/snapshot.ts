import { keccak256, stringToHex, zeroAddress } from 'viem';
import type {
  MonitorSnapshot,
  SnapshotFunction,
  SnapshotPermission,
} from './changes.js';

export function normalizeMonitorAddress(value: string | null | undefined): string | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === zeroAddress || lower === '0x' || lower === '0x0') return null;
  return lower;
}

export function hashFunctions(functions: Array<{ name: string; selector: string }>): string {
  const parts = functions.map(
    (fn) => `${fn.selector.toLowerCase()}:${fn.name.trim().toLowerCase() || 'unknown'}`,
  );
  return hashCanonical(parts);
}

export function hashPermissions(
  permissions: Array<{ type: string; address: string }>,
): string {
  const parts = permissions.map(
    (permission) =>
      `${permission.type.toLowerCase()}:${permission.address.toLowerCase()}`,
  );
  return hashCanonical(parts);
}

export function hashCanonical(parts: string[]): string {
  return keccak256(stringToHex(parts.slice().sort().join('|')));
}

export function ownerFromPermissions(
  permissions: Array<{ type: string; address: string }>,
): string | null {
  const owner = permissions.find((permission) => permission.type.toLowerCase() === 'owner');
  return normalizeMonitorAddress(owner?.address);
}

export function buildMonitorSnapshot(input: {
  hookId: string;
  blockNumber: bigint;
  implementationAddress?: string | null;
  adminAddress?: string | null;
  ownerAddress?: string | null;
  bytecodeHash: string;
  functions: SnapshotFunction[];
  permissions: SnapshotPermission[];
}): MonitorSnapshot {
  const permissions = input.permissions.map((permission) => ({
    type: permission.type,
    address: permission.address.toLowerCase(),
    source: permission.source,
  }));
  const functions = input.functions.map((fn) => ({
    name: fn.name,
    selector: fn.selector.toLowerCase(),
    visibility: fn.visibility,
    stateMutability: fn.stateMutability,
  }));

  return {
    hookId: input.hookId,
    blockNumber: input.blockNumber,
    implementationAddress: normalizeMonitorAddress(input.implementationAddress),
    adminAddress: normalizeMonitorAddress(input.adminAddress),
    ownerAddress:
      normalizeMonitorAddress(input.ownerAddress) ?? ownerFromPermissions(permissions),
    bytecodeHash: input.bytecodeHash.toLowerCase(),
    functionsHash: hashFunctions(functions),
    permissionsHash: hashPermissions(permissions),
    functions,
    permissions,
  };
}
