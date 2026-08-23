import { getChainById, isSupportedChainId, normalizeAddress } from '@hookguard/blockchain';
import type {
  HookEventsResponse,
  HookListItem,
  HookMonitoringResponse,
  SecurityEventItem,
} from '@hookguard/types';
import { getAddress, isAddress } from 'viem';
import type { HookRepository } from '../hooks/hook.repository.js';
import { PrismaHookRepository } from '../hooks/hook.repository.js';
import { prisma } from '../../lib/prisma.js';
import {
  PrismaMonitoringRepository,
  type EventRecord,
  type MonitoringRepository,
  type SnapshotRecord,
} from './repository.js';

export class MonitoringService {
  constructor(
    private readonly monitoring: MonitoringRepository,
    private readonly hooks: HookRepository,
  ) {}

  async getEvents(address: string, chainId?: number): Promise<HookEventsResponse> {
    const deployments = await this.requireDeployments(address, chainId);
    return {
      deployments: await Promise.all(
        deployments.map(async (hook) => ({
          hook: toHookItem(hook),
          events: (await this.monitoring.listEvents(hook.id)).map(toEventItem),
        })),
      ),
    };
  }

  async getMonitoring(address: string, chainId?: number): Promise<HookMonitoringResponse> {
    const deployments = await this.requireDeployments(address, chainId);
    return {
      deployments: await Promise.all(
        deployments.map(async (hook) => {
          const [lastSnapshot, snapshotCount, eventCount] = await Promise.all([
            this.monitoring.latestSnapshot(hook.id),
            this.monitoring.snapshotCount(hook.id),
            this.monitoring.eventCount(hook.id),
          ]);
          return {
            hook: toHookItem(hook),
            lastSnapshot: lastSnapshot ? toSnapshotView(lastSnapshot) : null,
            monitoring: {
              snapshotCount,
              lastSnapshot: lastSnapshot ? toSnapshotView(lastSnapshot) : null,
              lastMonitoredAt: lastSnapshot?.createdAt.toISOString() ?? null,
              eventCount,
            },
          };
        }),
      ),
    };
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

export function createMonitoringService(
  monitoring?: MonitoringRepository,
  hooks?: HookRepository,
): MonitoringService {
  return new MonitoringService(
    monitoring ?? new PrismaMonitoringRepository(prisma),
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
}): HookListItem {
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

function optionalAddress(value: string | null): `0x${string}` | null {
  if (!value) return null;
  try {
    return checksum(value);
  } catch {
    return null;
  }
}

function toSnapshotView(row: SnapshotRecord) {
  return {
    id: row.id,
    blockNumber: row.blockNumber.toString(),
    implementationAddress: optionalAddress(row.implementationAddress),
    adminAddress: optionalAddress(row.adminAddress),
    ownerAddress: optionalAddress(row.ownerAddress),
    bytecodeHash: row.bytecodeHash,
    functionsHash: row.functionsHash,
    permissionsHash: row.permissionsHash,
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
