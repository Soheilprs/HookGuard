import type { Address } from './hook.js';
import type { FindingConfidence, FindingSeverity } from './finding.js';

export type SecurityEventType =
  | 'IMPLEMENTATION_CHANGED'
  | 'PROXY_ADMIN_CHANGED'
  | 'OWNERSHIP_CHANGED'
  | 'BYTECODE_CHANGED'
  | 'PRIVILEGED_FUNCTION_ADDED'
  | 'PERMISSION_CHANGED';

export interface HookSnapshotView {
  id: string;
  blockNumber: string;
  implementationAddress: Address | null;
  adminAddress: Address | null;
  ownerAddress: Address | null;
  bytecodeHash: string;
  functionsHash: string;
  permissionsHash: string;
  createdAt: string;
}

export interface SecurityEventItem {
  id: string;
  type: SecurityEventType | string;
  severity: FindingSeverity | string;
  confidence: FindingConfidence | string;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface HookMonitoringStatus {
  snapshotCount: number;
  lastSnapshot: HookSnapshotView | null;
  lastMonitoredAt: string | null;
  eventCount: number;
}

export interface MonitoringStats {
  hooksMonitored: number;
  securityEvents: number;
  lastMonitoringRun: string | null;
}
