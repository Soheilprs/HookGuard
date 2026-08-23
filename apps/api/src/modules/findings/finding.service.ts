import {
  getChainById,
  isSupportedChainId,
  normalizeAddress,
  ruleTier,
} from '@hookguard/blockchain';
import type { FindingItem, HookFindingsResponse, HookListItem } from '@hookguard/types';
import { getAddress, isAddress } from 'viem';
import type { HookRepository } from '../hooks/hook.repository.js';
import { PrismaHookRepository } from '../hooks/hook.repository.js';
import { prisma } from '../../lib/prisma.js';
import {
  PrismaFindingRepository,
  type FindingRecord,
  type FindingRepository,
} from './finding.repository.js';

export class FindingService {
  constructor(
    private readonly findings: FindingRepository,
    private readonly hooks: HookRepository,
  ) {}

  async getForHook(address: string, chainId?: number): Promise<HookFindingsResponse> {
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

    return {
      deployments: await Promise.all(
        deployments.map(async (hook) => ({
          hook: toHookItem(hook),
          findings: (await this.findings.listByHookId(hook.id)).map(toItem),
        })),
      ),
    };
  }
}

export function createFindingService(
  findings?: FindingRepository,
  hooks?: HookRepository,
): FindingService {
  return new FindingService(
    findings ?? new PrismaFindingRepository(prisma),
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

function toItem(row: FindingRecord): FindingItem {
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
