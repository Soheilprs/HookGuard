import { randomUUID } from 'node:crypto';
import { type Prisma, type PrismaClient } from '@prisma/client';
import {
  changeFingerprint,
  type MonitorSnapshot,
  type SecurityChange,
  type SnapshotFunction,
  type SnapshotPermission,
} from '@hookguard/blockchain';

export interface SnapshotRecord {
  id: string;
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
  createdAt: Date;
}

export interface EventRecord {
  id: string;
  hookId: string;
  type: string;
  severity: string;
  confidence: string;
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  detectedAt: Date;
  resolvedAt: Date | null;
}

export interface MonitoringStatsRow {
  hooksMonitored: number;
  securityEvents: number;
  lastMonitoringRun: Date | null;
}

export interface MonitoringRepository {
  latestSnapshot(hookId: string): Promise<SnapshotRecord | null>;
  snapshotCount(hookId: string): Promise<number>;
  eventCount(hookId: string): Promise<number>;
  listEvents(hookId: string): Promise<EventRecord[]>;
  listRecentEvents(limit?: number): Promise<EventRecord[]>;
  getEvent(id: string): Promise<EventRecord | null>;
  commit(snapshot: MonitorSnapshot, events: SecurityChange[]): Promise<{
    snapshot: SnapshotRecord;
    events: EventRecord[];
  }>;
  stats(): Promise<MonitoringStatsRow>;
}

function asFunctionList(value: unknown): SnapshotFunction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Partial<SnapshotFunction>;
    if (!row.selector) return [];
    return [
      {
        name: String(row.name ?? 'unknown'),
        selector: String(row.selector),
        visibility: String(row.visibility ?? 'external'),
        stateMutability: String(row.stateMutability ?? 'nonpayable'),
      },
    ];
  });
}

function asPermissionList(value: unknown): SnapshotPermission[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Partial<SnapshotPermission>;
    if (!row.type || !row.address) return [];
    return [
      {
        type: String(row.type),
        address: String(row.address),
        source: String(row.source ?? ''),
      },
    ];
  });
}

export function snapshotRecordFromMonitor(
  snapshot: MonitorSnapshot,
  id: string,
  createdAt: Date,
): SnapshotRecord {
  return {
    id,
    hookId: snapshot.hookId,
    blockNumber: snapshot.blockNumber,
    implementationAddress: snapshot.implementationAddress,
    adminAddress: snapshot.adminAddress,
    ownerAddress: snapshot.ownerAddress,
    bytecodeHash: snapshot.bytecodeHash,
    functionsHash: snapshot.functionsHash,
    permissionsHash: snapshot.permissionsHash,
    functions: snapshot.functions,
    permissions: snapshot.permissions,
    createdAt,
  };
}

export function monitorSnapshotFromRecord(row: SnapshotRecord): MonitorSnapshot {
  return {
    hookId: row.hookId,
    blockNumber: row.blockNumber,
    implementationAddress: row.implementationAddress,
    adminAddress: row.adminAddress,
    ownerAddress: row.ownerAddress,
    bytecodeHash: row.bytecodeHash,
    functionsHash: row.functionsHash,
    permissionsHash: row.permissionsHash,
    functions: row.functions,
    permissions: row.permissions,
  };
}

export class InMemoryMonitoringRepository implements MonitoringRepository {
  readonly snapshots = new Map<string, SnapshotRecord[]>();
  readonly events = new Map<string, EventRecord[]>();

  async latestSnapshot(hookId: string): Promise<SnapshotRecord | null> {
    const rows = this.snapshots.get(hookId) ?? [];
    return rows[rows.length - 1] ?? null;
  }

  async snapshotCount(hookId: string): Promise<number> {
    return (this.snapshots.get(hookId) ?? []).length;
  }

  async eventCount(hookId: string): Promise<number> {
    return (this.events.get(hookId) ?? []).length;
  }

  async listEvents(hookId: string): Promise<EventRecord[]> {
    return [...(this.events.get(hookId) ?? [])].sort(
      (a, b) => b.detectedAt.getTime() - a.detectedAt.getTime(),
    );
  }

  async listRecentEvents(limit = 20): Promise<EventRecord[]> {
    const all: EventRecord[] = [];
    for (const rows of this.events.values()) all.push(...rows);
    return all
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  async getEvent(id: string): Promise<EventRecord | null> {
    for (const rows of this.events.values()) {
      const match = rows.find((row) => row.id === id);
      if (match) return match;
    }
    return null;
  }

  async commit(
    snapshot: MonitorSnapshot,
    events: SecurityChange[],
  ): Promise<{ snapshot: SnapshotRecord; events: EventRecord[] }> {
    const saved = snapshotRecordFromMonitor(snapshot, randomUUID(), new Date());
    const list = this.snapshots.get(snapshot.hookId) ?? [];
    list.push(saved);
    this.snapshots.set(snapshot.hookId, list);

    const existing = this.events.get(snapshot.hookId) ?? [];
    const fingerprints = new Set(
      existing
        .filter((row) => row.resolvedAt === null)
        .map((row) => String(row.evidence.fingerprint ?? '')),
    );
    const inserted: EventRecord[] = [];
    for (const change of events) {
      const fingerprint = changeFingerprint(change);
      if (fingerprints.has(fingerprint)) continue;
      fingerprints.add(fingerprint);
      const record: EventRecord = {
        id: randomUUID(),
        hookId: snapshot.hookId,
        type: change.type,
        severity: change.severity,
        confidence: change.confidence,
        title: change.title,
        description: change.description,
        evidence: { ...change.evidence, fingerprint },
        detectedAt: saved.createdAt,
        resolvedAt: null,
      };
      existing.push(record);
      inserted.push(record);
    }
    this.events.set(snapshot.hookId, existing);
    return { snapshot: saved, events: inserted };
  }

  async stats(): Promise<MonitoringStatsRow> {
    let last: Date | null = null;
    for (const rows of this.snapshots.values()) {
      for (const row of rows) {
        if (!last || row.createdAt > last) last = row.createdAt;
      }
    }
    let eventCount = 0;
    for (const rows of this.events.values()) eventCount += rows.length;
    return {
      hooksMonitored: this.snapshots.size,
      securityEvents: eventCount,
      lastMonitoringRun: last,
    };
  }
}

export class PrismaMonitoringRepository implements MonitoringRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async latestSnapshot(hookId: string): Promise<SnapshotRecord | null> {
    const row = await this.prisma.hookSnapshot.findFirst({
      where: { hookId },
      orderBy: [{ createdAt: 'desc' }, { blockNumber: 'desc' }],
    });
    return row ? toSnapshotRecord(row) : null;
  }

  async snapshotCount(hookId: string): Promise<number> {
    return this.prisma.hookSnapshot.count({ where: { hookId } });
  }

  async eventCount(hookId: string): Promise<number> {
    return this.prisma.securityEvent.count({ where: { hookId } });
  }

  async listEvents(hookId: string): Promise<EventRecord[]> {
    const rows = await this.prisma.securityEvent.findMany({
      where: { hookId },
      orderBy: { detectedAt: 'desc' },
    });
    return rows.map(toEventRecord);
  }

  async listRecentEvents(limit = 20): Promise<EventRecord[]> {
    const rows = await this.prisma.securityEvent.findMany({
      orderBy: { detectedAt: 'desc' },
      take: limit,
    });
    return rows.map(toEventRecord);
  }

  async getEvent(id: string): Promise<EventRecord | null> {
    const row = await this.prisma.securityEvent.findUnique({ where: { id } });
    return row ? toEventRecord(row) : null;
  }

  async commit(
    snapshot: MonitorSnapshot,
    events: SecurityChange[],
  ): Promise<{ snapshot: SnapshotRecord; events: EventRecord[] }> {
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.hookSnapshot.create({
        data: {
          hookId: snapshot.hookId,
          blockNumber: snapshot.blockNumber,
          implementationAddress: snapshot.implementationAddress,
          adminAddress: snapshot.adminAddress,
          ownerAddress: snapshot.ownerAddress,
          bytecodeHash: snapshot.bytecodeHash,
          functionsHash: snapshot.functionsHash,
          permissionsHash: snapshot.permissionsHash,
          functionsJson: snapshot.functions as unknown as Prisma.InputJsonValue,
          permissionsJson: snapshot.permissions as unknown as Prisma.InputJsonValue,
        },
      });

      const unresolved = await tx.securityEvent.findMany({
        where: { hookId: snapshot.hookId, resolvedAt: null },
      });
      const fingerprints = new Set(
        unresolved.map((row) => {
          const evidence = asEvidence(row.evidence);
          return String(evidence.fingerprint ?? '');
        }),
      );

      const inserted: EventRecord[] = [];
      for (const change of events) {
        const fingerprint = changeFingerprint(change);
        if (fingerprints.has(fingerprint)) continue;
        fingerprints.add(fingerprint);
        const row = await tx.securityEvent.create({
          data: {
            hookId: snapshot.hookId,
            type: change.type,
            severity: change.severity,
            confidence: change.confidence,
            title: change.title,
            description: change.description,
            evidence: { ...change.evidence, fingerprint } as Prisma.InputJsonValue,
          },
        });
        inserted.push(toEventRecord(row));
      }

      return { snapshot: toSnapshotRecord(saved), events: inserted };
    });
  }

  async stats(): Promise<MonitoringStatsRow> {
    const [hooksMonitored, securityEvents, latest] = await Promise.all([
      this.prisma.hookSnapshot.findMany({
        distinct: ['hookId'],
        select: { hookId: true },
      }),
      this.prisma.securityEvent.count(),
      this.prisma.hookSnapshot.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);
    return {
      hooksMonitored: hooksMonitored.length,
      securityEvents,
      lastMonitoringRun: latest?.createdAt ?? null,
    };
  }
}

function asEvidence(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toSnapshotRecord(row: {
  id: string;
  hookId: string;
  blockNumber: bigint;
  implementationAddress: string | null;
  adminAddress: string | null;
  ownerAddress: string | null;
  bytecodeHash: string;
  functionsHash: string;
  permissionsHash: string;
  functionsJson: unknown;
  permissionsJson: unknown;
  createdAt: Date;
}): SnapshotRecord {
  return {
    id: row.id,
    hookId: row.hookId,
    blockNumber: row.blockNumber,
    implementationAddress: row.implementationAddress,
    adminAddress: row.adminAddress,
    ownerAddress: row.ownerAddress,
    bytecodeHash: row.bytecodeHash,
    functionsHash: row.functionsHash,
    permissionsHash: row.permissionsHash,
    functions: asFunctionList(row.functionsJson),
    permissions: asPermissionList(row.permissionsJson),
    createdAt: row.createdAt,
  };
}

function toEventRecord(row: {
  id: string;
  hookId: string;
  type: string;
  severity: string;
  confidence: string;
  title: string;
  description: string;
  evidence: unknown;
  detectedAt: Date;
  resolvedAt: Date | null;
}): EventRecord {
  return {
    id: row.id,
    hookId: row.hookId,
    type: row.type,
    severity: row.severity,
    confidence: row.confidence,
    title: row.title,
    description: row.description,
    evidence: asEvidence(row.evidence),
    detectedAt: row.detectedAt,
    resolvedAt: row.resolvedAt,
  };
}
