import {
  getChainById,
  isSupportedChainId,
  normalizeAddress,
} from '@hookguard/blockchain';
import type {
  ChainDefinition,
  HookDetail,
  HookListItem,
  PoolListItem,
  RegistryStats,
} from '@hookguard/types';
import { isAddress, getAddress } from 'viem';
import {
  PrismaHookRepository,
  type HookRecord,
  type HookRepository,
  type PoolRecord,
} from './hook.repository.js';
import { prisma } from '../../lib/prisma.js';

export class HookService {
  constructor(private readonly repository: HookRepository) {}

  async listHooks(chainId?: number, limit?: number) {
    if (chainId !== undefined && !isSupportedChainId(chainId)) {
      const error = new Error(`Unsupported chain: ${chainId}`);
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }

    const [hooks, total] = await Promise.all([
      this.repository.listHooks({ chainId, limit }),
      this.repository.countHooks(chainId),
    ]);

    return {
      hooks: hooks.map(toListItem),
      total,
    };
  }

  async getByAddress(address: string, chainId?: number) {
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

    const deployments = await this.repository.getByAddress(address, chainId);
    return {
      deployments: deployments.map((row) => ({
        hook: toListItem(row),
        pools: row.pools.map(toPoolItem),
        analysisStatus: 'pending' as const,
      })),
    };
  }

  async stats(): Promise<RegistryStats> {
    const [hooksIndexed, poolsTracked] = await Promise.all([
      this.repository.countHooks(),
      this.repository.countPools(),
    ]);
    return {
      hooksIndexed,
      poolsTracked,
      findings: 0,
      averageRisk: null,
      contractsInspected: 0,
      verifiedSource: 0,
      hooksMonitored: 0,
      securityEvents: 0,
      lastMonitoringRun: null,
      alertsPending: 0,
      alertsSent: 0,
      byChain: [],
    };
  }
}

export function createHookService(repository?: HookRepository): HookService {
  return new HookService(repository ?? new PrismaHookRepository(prisma));
}

function chainRef(chainId: number): { id: number; slug: string; name: string } {
  const chain: ChainDefinition | undefined = getChainById(chainId);
  return {
    id: chainId,
    slug: chain?.slug ?? String(chainId),
    name: chain?.name ?? `Chain ${chainId}`,
  };
}

function checksum(address: string): `0x${string}` {
  try {
    return normalizeAddress(address);
  } catch {
    return getAddress(address);
  }
}

function toListItem(hook: HookRecord): HookListItem {
  return {
    id: hook.id,
    address: checksum(hook.address),
    chainId: hook.chainId,
    chain: chainRef(hook.chainId),
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
    poolId: (pool.poolId.startsWith('0x')
      ? pool.poolId
      : `0x${pool.poolId}`) as `0x${string}`,
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

export type { HookDetail };
