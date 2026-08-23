import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { AlertDeliveryStatus } from '@hookguard/types';

export const MAX_ALERT_ATTEMPTS = 5;

export interface DeliveryRecord {
  id: string;
  securityEventId: string;
  watchlistId: string;
  status: AlertDeliveryStatus;
  sentAt: Date | null;
  error: string | null;
  attempts: number;
}

export interface AlertRepository {
  getDelivery(securityEventId: string, watchlistId: string): Promise<DeliveryRecord | null>;
  createPending(securityEventId: string, watchlistId: string): Promise<DeliveryRecord>;
  markSent(id: string): Promise<DeliveryRecord>;
  markFailed(id: string, error: string): Promise<DeliveryRecord>;
  listRetryable(limit?: number): Promise<DeliveryRecord[]>;
  listByHookWatchlists(watchlistIds: string[]): Promise<DeliveryRecord[]>;
  listRecent(limit?: number): Promise<DeliveryRecord[]>;
  countByStatus(status: AlertDeliveryStatus): Promise<number>;
}

export class InMemoryAlertRepository implements AlertRepository {
  readonly deliveries = new Map<string, DeliveryRecord>();

  private key(securityEventId: string, watchlistId: string): string {
    return `${securityEventId}:${watchlistId}`;
  }

  async getDelivery(
    securityEventId: string,
    watchlistId: string,
  ): Promise<DeliveryRecord | null> {
    return this.deliveries.get(this.key(securityEventId, watchlistId)) ?? null;
  }

  async createPending(securityEventId: string, watchlistId: string): Promise<DeliveryRecord> {
    const existing = await this.getDelivery(securityEventId, watchlistId);
    if (existing) return existing;
    const record: DeliveryRecord = {
      id: randomUUID(),
      securityEventId,
      watchlistId,
      status: 'PENDING',
      sentAt: null,
      error: null,
      attempts: 0,
    };
    this.deliveries.set(this.key(securityEventId, watchlistId), record);
    return record;
  }

  async markSent(id: string): Promise<DeliveryRecord> {
    const row = this.must(id);
    row.status = 'SENT';
    row.sentAt = new Date();
    row.error = null;
    row.attempts += 1;
    return row;
  }

  async markFailed(id: string, error: string): Promise<DeliveryRecord> {
    const row = this.must(id);
    row.status = 'FAILED';
    row.error = error;
    row.attempts += 1;
    return row;
  }

  async listRetryable(limit = 50): Promise<DeliveryRecord[]> {
    return [...this.deliveries.values()]
      .filter(
        (row) =>
          row.attempts < MAX_ALERT_ATTEMPTS &&
          (row.status === 'PENDING' || row.status === 'FAILED'),
      )
      .slice(0, limit);
  }

  async listByHookWatchlists(watchlistIds: string[]): Promise<DeliveryRecord[]> {
    const ids = new Set(watchlistIds);
    return [...this.deliveries.values()]
      .filter((row) => ids.has(row.watchlistId))
      .sort((a, b) => (b.sentAt ?? new Date(0)).getTime() - (a.sentAt ?? new Date(0)).getTime());
  }

  async listRecent(limit = 20): Promise<DeliveryRecord[]> {
    return [...this.deliveries.values()]
      .sort((a, b) => {
        const aTime = (a.sentAt ?? new Date(0)).getTime();
        const bTime = (b.sentAt ?? new Date(0)).getTime();
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  async countByStatus(status: AlertDeliveryStatus): Promise<number> {
    return [...this.deliveries.values()].filter((row) => row.status === status).length;
  }

  private must(id: string): DeliveryRecord {
    const row = [...this.deliveries.values()].find((item) => item.id === id);
    if (!row) throw new Error(`Unknown delivery ${id}`);
    return row;
  }
}

export class PrismaAlertRepository implements AlertRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getDelivery(
    securityEventId: string,
    watchlistId: string,
  ): Promise<DeliveryRecord | null> {
    const row = await this.prisma.alertDelivery.findUnique({
      where: {
        securityEventId_watchlistId: { securityEventId, watchlistId },
      },
    });
    return row ? toDelivery(row) : null;
  }

  async createPending(securityEventId: string, watchlistId: string): Promise<DeliveryRecord> {
    const existing = await this.getDelivery(securityEventId, watchlistId);
    if (existing) return existing;
    const row = await this.prisma.alertDelivery.create({
      data: { securityEventId, watchlistId, status: 'PENDING' },
    });
    return toDelivery(row);
  }

  async markSent(id: string): Promise<DeliveryRecord> {
    const row = await this.prisma.alertDelivery.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        error: null,
        attempts: { increment: 1 },
      },
    });
    return toDelivery(row);
  }

  async markFailed(id: string, error: string): Promise<DeliveryRecord> {
    const row = await this.prisma.alertDelivery.update({
      where: { id },
      data: {
        status: 'FAILED',
        error: error.slice(0, 1000),
        attempts: { increment: 1 },
      },
    });
    return toDelivery(row);
  }

  async listRetryable(limit = 50): Promise<DeliveryRecord[]> {
    const rows = await this.prisma.alertDelivery.findMany({
      where: {
        attempts: { lt: MAX_ALERT_ATTEMPTS },
        status: { in: ['PENDING', 'FAILED'] },
      },
      take: limit,
      orderBy: { id: 'asc' },
    });
    return rows.map(toDelivery);
  }

  async listByHookWatchlists(watchlistIds: string[]): Promise<DeliveryRecord[]> {
    if (watchlistIds.length === 0) return [];
    const rows = await this.prisma.alertDelivery.findMany({
      where: { watchlistId: { in: watchlistIds } },
      orderBy: { sentAt: 'desc' },
    });
    return rows.map(toDelivery);
  }

  async listRecent(limit = 20): Promise<DeliveryRecord[]> {
    const rows = await this.prisma.alertDelivery.findMany({
      orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return rows.map(toDelivery);
  }

  async countByStatus(status: AlertDeliveryStatus): Promise<number> {
    return this.prisma.alertDelivery.count({ where: { status } });
  }
}

function toDelivery(row: {
  id: string;
  securityEventId: string;
  watchlistId: string;
  status: string;
  sentAt: Date | null;
  error: string | null;
  attempts: number;
}): DeliveryRecord {
  return {
    id: row.id,
    securityEventId: row.securityEventId,
    watchlistId: row.watchlistId,
    status: row.status as DeliveryRecord['status'],
    sentAt: row.sentAt,
    error: row.error,
    attempts: row.attempts,
  };
}
