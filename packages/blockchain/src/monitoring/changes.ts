import type {
  FindingConfidence,
  FindingSeverity,
  SecurityEventType,
} from '@hookguard/types';

export interface SnapshotFunction {
  name: string;
  selector: string;
  visibility: string;
  stateMutability: string;
}

export interface SnapshotPermission {
  type: string;
  address: string;
  source: string;
}

/** In-memory security state used by detectors. Richer than the persisted row. */
export interface MonitorSnapshot {
  hookId: string;
  blockNumber: bigint;
  implementationAddress: string | null;
  adminAddress: string | null;
  ownerAddress: string | null;
  bytecodeHash: string;
  functionsHash: string;
  permissionsHash: string;
  functions: SnapshotFunction[];
  permissions: SnapshotPermission[];
}

export interface SecurityChange {
  type: SecurityEventType;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
}

export const SECURITY_EVENT_TYPES = {
  IMPLEMENTATION_CHANGED: 'IMPLEMENTATION_CHANGED',
  PROXY_ADMIN_CHANGED: 'PROXY_ADMIN_CHANGED',
  OWNERSHIP_CHANGED: 'OWNERSHIP_CHANGED',
  BYTECODE_CHANGED: 'BYTECODE_CHANGED',
  PRIVILEGED_FUNCTION_ADDED: 'PRIVILEGED_FUNCTION_ADDED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
} as const satisfies Record<string, SecurityEventType>;

export function changeFingerprint(change: SecurityChange): string {
  const from = JSON.stringify(change.evidence.from ?? null);
  const to = JSON.stringify(change.evidence.to ?? null);
  return `${change.type}:${from}:${to}`;
}
