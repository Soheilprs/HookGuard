import {
  byteLength,
  getChainById,
  isSupportedChainId,
  normalizeAddress,
} from '@hookguard/blockchain';
import type {
  ContractIntelligence,
  HookContractResponse,
  HookListItem,
} from '@hookguard/types';
import { getAddress, isAddress } from 'viem';
import type { HookRepository } from '../hooks/hook.repository.js';
import { PrismaHookRepository } from '../hooks/hook.repository.js';
import { prisma } from '../../lib/prisma.js';
import {
  PrismaContractRepository,
  type ContractRecord,
  type ContractRepository,
} from './contract.repository.js';

export class ContractService {
  constructor(
    private readonly contracts: ContractRepository,
    private readonly hooks: HookRepository,
  ) {}

  async getForHook(address: string, chainId?: number): Promise<HookContractResponse> {
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

    const contracts = await this.contracts.getByAddress(address, chainId);
    const byChain = new Map(contracts.map((row) => [row.chainId, row]));

    return {
      deployments: deployments.map((row) => ({
        hook: toHookItem(row),
        contract: toIntelligence(byChain.get(row.chainId) ?? null),
        analysisStatus: 'pending' as const,
      })),
    };
  }
}

export function createContractService(
  contracts?: ContractRepository,
  hooks?: HookRepository,
): ContractService {
  return new ContractService(
    contracts ?? new PrismaContractRepository(prisma),
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
  return {
    id: hook.id,
    address: checksum(hook.address),
    chainId: hook.chainId,
    chain: {
      id: hook.chainId,
      slug: getChainById(hook.chainId)?.slug ?? String(hook.chainId),
      name: getChainById(hook.chainId)?.name ?? `Chain ${hook.chainId}`,
    },
    creator: checksum(hook.creator),
    poolCount: hook.poolCount,
    firstSeenBlock: hook.firstSeenBlock.toString(),
    lastSeenBlock: hook.lastSeenBlock.toString(),
    lastIndexedAt: hook.lastIndexedAt?.toISOString() ?? null,
    verifiedSource: hook.verifiedSource,
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
