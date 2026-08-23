import { getChainById, normalizeAddress } from '@hookguard/blockchain';
import type {
  AlertDeliveryItem,
  HookAlertsResponse,
  RecentAlertsResponse,
} from '@hookguard/types';
import { getAddress } from 'viem';
import type { EventRecord, MonitoringRepository } from '../monitoring/repository.js';
import { PrismaMonitoringRepository } from '../monitoring/repository.js';
import type { HookRepository } from '../hooks/hook.repository.js';
import { PrismaHookRepository } from '../hooks/hook.repository.js';
import type { WatchlistRepository, WatchRecord } from '../watchlist/repository.js';
import { PrismaWatchlistRepository } from '../watchlist/repository.js';
import { prisma } from '../../lib/prisma.js';
import {
  PrismaAlertRepository,
  type AlertRepository,
  type DeliveryRecord,
} from './alert.repository.js';
import type { AlertMessage, Notifier } from './notifier.js';
import { telegramFromEnv } from './telegram.js';

export interface DispatchResult {
  considered: number;
  delivered: number;
  pending: number;
  failed: number;
  skipped: number;
}

export class AlertService {
  constructor(
    private readonly alerts: AlertRepository,
    private readonly watches: WatchlistRepository,
    private readonly events: MonitoringRepository,
    private readonly hooks: HookRepository,
    private readonly notifier: Notifier,
  ) {}

  async dispatch(events: EventRecord[]): Promise<DispatchResult> {
    const result: DispatchResult = {
      considered: 0,
      delivered: 0,
      pending: 0,
      failed: 0,
      skipped: 0,
    };

    for (const event of events) {
      const watches = await this.watches.listByHookId(event.hookId);
      for (const watch of watches) {
        if (!preferenceAllows(watch, event.type)) {
          result.skipped += 1;
          continue;
        }
        result.considered += 1;
        const existing = await this.alerts.getDelivery(event.id, watch.id);
        if (existing?.status === 'SENT') {
          result.skipped += 1;
          continue;
        }
        const delivery =
          existing ?? (await this.alerts.createPending(event.id, watch.id));
        const outcome = await this.attempt(delivery, event, watch);
        if (outcome === 'SENT') result.delivered += 1;
        else if (outcome === 'FAILED') result.failed += 1;
        else result.pending += 1;
      }
    }

    return result;
  }

  async retryPending(limit = 50): Promise<DispatchResult> {
    const retryable = await this.alerts.listRetryable(limit);
    const events: EventRecord[] = [];
    for (const row of retryable) {
      const event = await this.events.getEvent(row.securityEventId);
      if (event) events.push(event);
    }
    return this.dispatch(events);
  }

  async listForHook(
    address: string,
    identifier: string,
    chainId?: number,
  ): Promise<HookAlertsResponse> {
    const deployments = await this.hooks.getByAddress(address, chainId);
    if (deployments.length === 0) {
      const error = new Error('Hook not indexed');
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }
    return {
      deployments: await Promise.all(
        deployments.map(async (hook) => {
          const watch = await this.watches.get(hook.id, identifier);
          const deliveries = watch
            ? await this.alerts.listByHookWatchlists([watch.id])
            : [];
          const alerts: AlertDeliveryItem[] = [];
          for (const delivery of deliveries) {
            const item = await this.toItem(delivery);
            if (item) alerts.push(item);
          }
          return { hook: toHookItem(hook), alerts };
        }),
      ),
    };
  }

  async listRecent(limit = 20): Promise<RecentAlertsResponse> {
    const rows = await this.alerts.listRecent(limit);
    const alerts: AlertDeliveryItem[] = [];
    for (const row of rows) {
      const item = await this.toItem(row);
      if (item) alerts.push(item);
    }
    return { alerts };
  }

  private async attempt(
    delivery: DeliveryRecord,
    event: EventRecord,
    watch: WatchRecord,
  ): Promise<'SENT' | 'PENDING' | 'FAILED'> {
    if (delivery.status === 'SENT') return 'SENT';
    const hook = await this.hooks.getById(event.hookId);
    if (!hook) {
      await this.alerts.markFailed(delivery.id, 'Hook missing');
      return 'FAILED';
    }
    const message = toMessage(event, hook);
    const result = await this.notifier.send(message);
    if (result.skipped) {
      return 'PENDING';
    }
    if (result.ok) {
      await this.alerts.markSent(delivery.id);
      await this.watches.touchNotified(watch.id);
      return 'SENT';
    }
    await this.alerts.markFailed(delivery.id, result.error ?? 'Send failed');
    return 'FAILED';
  }

  private async toItem(delivery: DeliveryRecord): Promise<AlertDeliveryItem | null> {
    const event = await this.events.getEvent(delivery.securityEventId);
    if (!event) return null;
    const hook = await this.hooks.getById(event.hookId);
    if (!hook) return null;
    const { fingerprint: _fingerprint, ...evidence } = event.evidence;
    return {
      id: delivery.id,
      status: delivery.status,
      sentAt: delivery.sentAt?.toISOString() ?? null,
      error: delivery.error,
      attempts: delivery.attempts,
      hookAddress: checksum(hook.address),
      chainId: hook.chainId,
      event: {
        id: event.id,
        type: event.type,
        severity: event.severity,
        confidence: event.confidence,
        title: event.title,
        description: event.description,
        evidence,
        detectedAt: event.detectedAt.toISOString(),
        resolvedAt: event.resolvedAt?.toISOString() ?? null,
      },
    };
  }
}

export function createAlertService(
  alerts?: AlertRepository,
  watches?: WatchlistRepository,
  events?: MonitoringRepository,
  hooks?: HookRepository,
  notifier?: Notifier,
): AlertService {
  return new AlertService(
    alerts ?? new PrismaAlertRepository(prisma),
    watches ?? new PrismaWatchlistRepository(prisma),
    events ?? new PrismaMonitoringRepository(prisma),
    hooks ?? new PrismaHookRepository(prisma),
    notifier ?? telegramFromEnv(),
  );
}

function preferenceAllows(watch: WatchRecord, eventType: string): boolean {
  const match = watch.preferences.find(
    (pref) => pref.eventType.toUpperCase() === eventType.toUpperCase(),
  );
  if (!match) return true;
  return match.enabled;
}

function toMessage(
  event: EventRecord,
  hook: { address: string; chainId: number },
): AlertMessage {
  const chain = getChainById(hook.chainId);
  return {
    hookAddress: checksum(hook.address),
    chainId: hook.chainId,
    chainName: chain?.name ?? `Chain ${hook.chainId}`,
    eventType: event.type,
    title: event.title,
    description: event.description,
    severity: event.severity,
    confidence: event.confidence,
  };
}

function checksum(address: string): `0x${string}` {
  try {
    return normalizeAddress(address);
  } catch {
    return getAddress(address);
  }
}

function toHookItem(hook: {
  id: string;
  address: string;
  chainId: number;
  creator: string;
  poolCount: number;
  firstSeenBlock: bigint;
  lastSeenBlock: bigint;
  lastIndexedAt: Date | null;
  verifiedSource: boolean;
}) {
  const chain = getChainById(hook.chainId);
  return {
    id: hook.id,
    address: checksum(hook.address),
    chainId: hook.chainId,
    chain: {
      id: hook.chainId,
      slug: chain?.slug ?? String(hook.chainId),
      name: chain?.name ?? `Chain ${hook.chainId}`,
    },
    creator: checksum(hook.creator),
    poolCount: hook.poolCount,
    firstSeenBlock: hook.firstSeenBlock.toString(),
    lastSeenBlock: hook.lastSeenBlock.toString(),
    lastIndexedAt: hook.lastIndexedAt?.toISOString() ?? null,
    verifiedSource: hook.verifiedSource,
  };
}
