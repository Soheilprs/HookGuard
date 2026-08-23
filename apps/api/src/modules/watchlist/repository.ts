import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { DEFAULT_ALERT_EVENT_TYPES } from '@hookguard/types';

export interface PreferenceRecord {
  id: string;
  watchlistId: string;
  eventType: string;
  enabled: boolean;
  createdAt: Date;
}

export interface WatchRecord {
  id: string;
  hookId: string;
  identifier: string;
  createdAt: Date;
  lastNotifiedAt: Date | null;
  preferences: PreferenceRecord[];
}

export interface WatchlistRepository {
  upsert(input: {
    hookId: string;
    identifier: string;
    eventTypes?: string[];
  }): Promise<WatchRecord>;
  remove(hookId: string, identifier: string): Promise<boolean>;
  get(hookId: string, identifier: string): Promise<WatchRecord | null>;
  listByIdentifier(identifier: string): Promise<WatchRecord[]>;
  listByHookId(hookId: string): Promise<WatchRecord[]>;
  touchNotified(id: string, at?: Date): Promise<void>;
}

function defaultPreferences(watchlistId: string, eventTypes?: string[]): PreferenceRecord[] {
  const enabled = new Set(
    (eventTypes && eventTypes.length > 0
      ? eventTypes
      : [...DEFAULT_ALERT_EVENT_TYPES]
    ).map((type) => type.toUpperCase()),
  );
  const types = [...DEFAULT_ALERT_EVENT_TYPES, 'PERMISSION_CHANGED'];
  const unique = [...new Set([...types, ...enabled])];
  return unique.map((eventType) => ({
    id: randomUUID(),
    watchlistId,
    eventType,
    enabled: enabled.has(eventType),
    createdAt: new Date(),
  }));
}

export class InMemoryWatchlistRepository implements WatchlistRepository {
  readonly watches = new Map<string, WatchRecord>();

  private key(hookId: string, identifier: string): string {
    return `${hookId}:${identifier}`;
  }

  async upsert(input: {
    hookId: string;
    identifier: string;
    eventTypes?: string[];
  }): Promise<WatchRecord> {
    const key = this.key(input.hookId, input.identifier);
    const existing = this.watches.get(key);
    if (existing) {
      if (input.eventTypes && input.eventTypes.length > 0) {
        existing.preferences = defaultPreferences(existing.id, input.eventTypes);
      }
      return existing;
    }
    const id = randomUUID();
    const record: WatchRecord = {
      id,
      hookId: input.hookId,
      identifier: input.identifier,
      createdAt: new Date(),
      lastNotifiedAt: null,
      preferences: defaultPreferences(id, input.eventTypes),
    };
    this.watches.set(key, record);
    return record;
  }

  async remove(hookId: string, identifier: string): Promise<boolean> {
    return this.watches.delete(this.key(hookId, identifier));
  }

  async get(hookId: string, identifier: string): Promise<WatchRecord | null> {
    return this.watches.get(this.key(hookId, identifier)) ?? null;
  }

  async listByIdentifier(identifier: string): Promise<WatchRecord[]> {
    return [...this.watches.values()].filter((row) => row.identifier === identifier);
  }

  async listByHookId(hookId: string): Promise<WatchRecord[]> {
    return [...this.watches.values()].filter((row) => row.hookId === hookId);
  }

  async touchNotified(id: string, at = new Date()): Promise<void> {
    for (const row of this.watches.values()) {
      if (row.id === id) row.lastNotifiedAt = at;
    }
  }
}

export class PrismaWatchlistRepository implements WatchlistRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(input: {
    hookId: string;
    identifier: string;
    eventTypes?: string[];
  }): Promise<WatchRecord> {
    const existing = await this.prisma.watchlist.findUnique({
      where: {
        hookId_identifier: { hookId: input.hookId, identifier: input.identifier },
      },
      include: { preferences: true },
    });
    if (existing) {
      if (input.eventTypes && input.eventTypes.length > 0) {
        await this.prisma.alertPreference.deleteMany({ where: { watchlistId: existing.id } });
        const prefs = defaultPreferences(existing.id, input.eventTypes);
        await this.prisma.alertPreference.createMany({
          data: prefs.map((pref) => ({
            watchlistId: existing.id,
            eventType: pref.eventType,
            enabled: pref.enabled,
          })),
        });
        const updated = await this.prisma.watchlist.findUniqueOrThrow({
          where: { id: existing.id },
          include: { preferences: true },
        });
        return toWatch(updated);
      }
      return toWatch(existing);
    }

    const created = await this.prisma.watchlist.create({
      data: {
        hookId: input.hookId,
        identifier: input.identifier,
        preferences: {
          create: defaultPreferences('tmp', input.eventTypes).map((pref) => ({
            eventType: pref.eventType,
            enabled: pref.enabled,
          })),
        },
      },
      include: { preferences: true },
    });
    return toWatch(created);
  }

  async remove(hookId: string, identifier: string): Promise<boolean> {
    const result = await this.prisma.watchlist.deleteMany({
      where: { hookId, identifier },
    });
    return result.count > 0;
  }

  async get(hookId: string, identifier: string): Promise<WatchRecord | null> {
    const row = await this.prisma.watchlist.findUnique({
      where: { hookId_identifier: { hookId, identifier } },
      include: { preferences: true },
    });
    return row ? toWatch(row) : null;
  }

  async listByIdentifier(identifier: string): Promise<WatchRecord[]> {
    const rows = await this.prisma.watchlist.findMany({
      where: { identifier },
      include: { preferences: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toWatch);
  }

  async listByHookId(hookId: string): Promise<WatchRecord[]> {
    const rows = await this.prisma.watchlist.findMany({
      where: { hookId },
      include: { preferences: true },
    });
    return rows.map(toWatch);
  }

  async touchNotified(id: string, at = new Date()): Promise<void> {
    await this.prisma.watchlist.update({
      where: { id },
      data: { lastNotifiedAt: at },
    });
  }
}

function toWatch(row: {
  id: string;
  hookId: string;
  identifier: string;
  createdAt: Date;
  lastNotifiedAt: Date | null;
  preferences: Array<{
    id: string;
    watchlistId: string;
    eventType: string;
    enabled: boolean;
    createdAt: Date;
  }>;
}): WatchRecord {
  return {
    id: row.id,
    hookId: row.hookId,
    identifier: row.identifier,
    createdAt: row.createdAt,
    lastNotifiedAt: row.lastNotifiedAt,
    preferences: row.preferences,
  };
}
