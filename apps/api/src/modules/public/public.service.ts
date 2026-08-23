import {
  byteLength,
  getChainById,
  isSupportedChainId,
  normalizeAddress,
  ruleTier,
} from '@hookguard/blockchain';
import type {
  ContractIntelligence,
  FindingItem,
  HookListItem,
  PoolListItem,
  PublicHookResponse,
  RecentEventsResponse,
  SecurityEventItem,
} from '@hookguard/types';
import { getAddress, isAddress } from 'viem';
import type { ContractRecord, ContractRepository } from '../contracts/contract.repository.js';
import { PrismaContractRepository } from '../contracts/contract.repository.js';
import type { FindingRecord, FindingRepository } from '../findings/finding.repository.js';
import { PrismaFindingRepository } from '../findings/finding.repository.js';
import type { HookRecord, HookRepository, PoolRecord } from '../hooks/hook.repository.js';
import { PrismaHookRepository } from '../hooks/hook.repository.js';
import type { EventRecord, MonitoringRepository, SnapshotRecord } from '../monitoring/repository.js';
import { PrismaMonitoringRepository } from '../monitoring/repository.js';
import { prisma } from '../../lib/prisma.js';
import type { WatchlistRepository } from '../watchlist/repository.js';
import { PrismaWatchlistRepository } from '../watchlist/repository.js';
import { normalizeIdentifier } from '../watchlist/service.js';

export class PublicHookService {
  constructor(
    private readonly hooks: HookRepository,
    private readonly contracts: ContractRepository,
    private readonly findings: FindingRepository,
    private readonly monitoring: MonitoringRepository,
    private readonly watches: WatchlistRepository,
  ) {}

  async getPublicHook(
    address: string,
    chainId?: number,
    identifier?: string,
  ): Promise<PublicHookResponse> {
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

    const id = identifier ? normalizeIdentifier(identifier) : null;

    return {
      deployments: await Promise.all(
        deployments.map(async (hook) => {
          const [contractRows, findings, events, lastSnapshot, snapshotCount, eventCount, watch] =
            await Promise.all([
              this.contracts.getByAddress(hook.address, hook.chainId),
              this.findings.listByHookId(hook.id),
              this.monitoring.listEvents(hook.id),
              this.monitoring.latestSnapshot(hook.id),
              this.monitoring.snapshotCount(hook.id),
              this.monitoring.eventCount(hook.id),
              id ? this.watches.get(hook.id, id) : Promise.resolve(null),
            ]);
          const snapshotView = lastSnapshot ? toSnapshotView(lastSnapshot) : null;
          return {
            hook: toHookItem(hook),
            pools: hook.pools.map(toPoolItem),
            contract: toIntelligence(contractRows[0] ?? null),
            findings: findings.map(toFindingItem),
            events: events.map(toEventItem),
            monitoring: {
              snapshotCount,
              lastSnapshot: snapshotView,
              lastMonitoredAt: lastSnapshot?.createdAt.toISOString() ?? null,
              eventCount,
            },
            lastSnapshot: snapshotView,
            watched: Boolean(watch),
          };
        }),
      ),
    };
  }

  async recentEvents(limit = 20): Promise<RecentEventsResponse> {
    const rows = await this.monitoring.listRecentEvents(Math.min(Math.max(limit, 1), 100));
    const events: RecentEventsResponse['events'] = [];
    for (const row of rows) {
      const hook = await this.hooks.getById(row.hookId);
      if (!hook) continue;
      events.push({ ...toEventItem(row), hook: toHookItem(hook) });
    }
    return { events };
  }
}

export function createPublicHookService(
  hooks?: HookRepository,
  contracts?: ContractRepository,
  findings?: FindingRepository,
  monitoring?: MonitoringRepository,
  watches?: WatchlistRepository,
): PublicHookService {
  return new PublicHookService(
    hooks ?? new PrismaHookRepository(prisma),
    contracts ?? new PrismaContractRepository(prisma),
    findings ?? new PrismaFindingRepository(prisma),
    monitoring ?? new PrismaMonitoringRepository(prisma),
    watches ?? new PrismaWatchlistRepository(prisma),
  );
}

function checksum(address: string): `0x${string}` {
  try {
    return normalizeAddress(address);
  } catch {
    return getAddress(address);
  }
}

function toHookItem(hook: HookRecord): HookListItem {
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

function toPoolItem(pool: PoolRecord): PoolListItem {
  return {
    id: pool.id,
    poolId: pool.poolId as `0x${string}`,
    chainId: pool.chainId,
    hookAddress: checksum(pool.hookAddress),
    token0Address: checksum(pool.token0Address),
    token1Address: checksum(pool.token1Address),
    token0Symbol: pool.token0Symbol,
    token1Symbol: pool.token1Symbol,
    currencyPair: pool.currencyPair,
    fee: pool.fee,
    tickSpacing: pool.tickSpacing,
    createdAtBlock: pool.createdAtBlock.toString(),
  };
}

function toIntelligence(row: ContractRecord | null): ContractIntelligence | null {
  if (!row) return null;
  return {
    address: checksum(row.address),
    chainId: row.chainId,
    bytecodeHash: row.bytecodeHash,
    bytecodeSize: byteLength(row.bytecode as `0x${string}`),
    sourceVerified: row.sourceVerified,
    sourceUrl: row.sourceUrl,
    compilerVersion: row.compilerVersion,
    isProxy: row.isProxy,
    implementationAddress: row.implementationAddress
      ? checksum(row.implementationAddress)
      : null,
    adminAddress: row.adminAddress ? checksum(row.adminAddress) : null,
    lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
    functions: row.functions.map((fn) => ({
      name: fn.name,
      selector: fn.selector,
      visibility: fn.visibility,
      stateMutability: fn.stateMutability,
    })),
    permissions: row.permissions.map((permission) => ({
      type: permission.type,
      address: checksum(permission.address),
      source: permission.source,
    })),
  };
}

function toFindingItem(row: FindingRecord): FindingItem {
  return {
    ruleId: row.ruleId,
    title: row.title,
    category: row.category,
    severity: row.severity,
    confidence: row.confidence,
    detectionSource: row.detectionSource,
    validationStatus: row.validationStatus,
    ruleTier: ruleTier(row.ruleId),
    description: row.description,
    evidence: row.evidence,
    createdAt: row.createdAt.toISOString(),
  };
}

function toEventItem(row: EventRecord): SecurityEventItem {
  const { fingerprint: _fingerprint, ...evidence } = row.evidence;
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    confidence: row.confidence,
    title: row.title,
    description: row.description,
    evidence,
    detectedAt: row.detectedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  };
}

function toSnapshotView(row: SnapshotRecord) {
  return {
    id: row.id,
    blockNumber: row.blockNumber.toString(),
    implementationAddress: row.implementationAddress
      ? checksum(row.implementationAddress)
      : null,
    adminAddress: row.adminAddress ? checksum(row.adminAddress) : null,
    ownerAddress: row.ownerAddress ? checksum(row.ownerAddress) : null,
    bytecodeHash: row.bytecodeHash,
    functionsHash: row.functionsHash,
    permissionsHash: row.permissionsHash,
    createdAt: row.createdAt.toISOString(),
  };
}
