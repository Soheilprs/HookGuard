import { getChainById, isSupportedChainId, normalizeAddress } from '@hookguard/blockchain';
import type {
  WatchlistItem,
  WatchlistResponse,
  WatchMutationResponse,
} from '@hookguard/types';
import { getAddress, isAddress } from 'viem';
import type { HookRecord, HookRepository } from '../hooks/hook.repository.js';
import { PrismaHookRepository } from '../hooks/hook.repository.js';
import { prisma } from '../../lib/prisma.js';
import {
  PrismaWatchlistRepository,
  type WatchlistRepository,
  type WatchRecord,
} from './repository.js';

export function normalizeIdentifier(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return 'anonymous';
  const cleaned = raw.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 64);
  return cleaned.length > 0 ? cleaned : 'anonymous';
}

export class WatchlistService {
  constructor(
    private readonly watches: WatchlistRepository,
    private readonly hooks: HookRepository,
  ) {}

  async watch(
    address: string,
    identifier: string,
    chainId?: number,
    eventTypes?: string[],
  ): Promise<WatchMutationResponse> {
    const deployments = await this.requireDeployments(address, chainId);
    const hook = deployments[0]!;
    const record = await this.watches.upsert({
      hookId: hook.id,
      identifier: normalizeIdentifier(identifier),
      eventTypes,
    });
    return { watched: true, watchlist: toItem(record, hook) };
  }

  async unwatch(
    address: string,
    identifier: string,
    chainId?: number,
  ): Promise<WatchMutationResponse> {
    const deployments = await this.requireDeployments(address, chainId);
    await this.watches.remove(deployments[0]!.id, normalizeIdentifier(identifier));
    return { watched: false, watchlist: null };
  }

  async status(
    address: string,
    identifier: string,
    chainId?: number,
  ): Promise<WatchMutationResponse> {
    const deployments = await this.requireDeployments(address, chainId);
    const hook = deployments[0]!;
    const record = await this.watches.get(hook.id, normalizeIdentifier(identifier));
    return {
      watched: Boolean(record),
      watchlist: record ? toItem(record, hook) : null,
    };
  }

  async list(identifier: string): Promise<WatchlistResponse> {
    const rows = await this.watches.listByIdentifier(normalizeIdentifier(identifier));
    const items: WatchlistItem[] = [];
    for (const row of rows) {
      const hook = await this.hooks.getById(row.hookId);
      if (hook) items.push(toItem(row, hook));
    }
    return { watchlists: items };
  }

  private async requireDeployments(address: string, chainId?: number) {
    if (!isAddress(address, { strict: false })) {
      const error = new Error('Invalid hook address');
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }
    if (chainId !== undefined && !isSupportedChainId(chainId)) {
      const error = new Error(`Unsupported chain: ${chainId}`);
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }
    const deployments = await this.hooks.getByAddress(address, chainId);
    if (deployments.length === 0) {
      const error = new Error('Hook not indexed');
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }
    return deployments;
  }
}

export function createWatchlistService(
  watches?: WatchlistRepository,
  hooks?: HookRepository,
): WatchlistService {
  return new WatchlistService(
    watches ?? new PrismaWatchlistRepository(prisma),
    hooks ?? new PrismaHookRepository(prisma),
  );
}

function checksum(address: string): `0x${string}` {
  try {
    return normalizeAddress(address);
  } catch {
    return getAddress(address);
  }
}

function toItem(row: WatchRecord, hook: HookRecord): WatchlistItem {
  const chain = getChainById(hook.chainId);
  return {
    id: row.id,
    identifier: row.identifier,
    createdAt: row.createdAt.toISOString(),
    lastNotifiedAt: row.lastNotifiedAt?.toISOString() ?? null,
    preferences: row.preferences.map((pref) => ({
      eventType: pref.eventType,
      enabled: pref.enabled,
    })),
    hook: {
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
    },
  };
}
