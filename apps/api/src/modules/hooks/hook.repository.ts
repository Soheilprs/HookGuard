import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

export interface HookRecord {
  id: string;
  address: string;
  chainId: number;
  creator: string;
  deploymentBlock: bigint;
  verifiedSource: boolean;
  riskScore: number | null;
  createdAt: Date;
  firstSeenBlock: bigint;
  lastSeenBlock: bigint;
  poolCount: number;
  lastIndexedAt: Date | null;
}

export interface PoolRecord {
  id: string;
  poolId: string;
  chainId: number;
  hookAddress: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  createdBlock: bigint;
  token0Address: string;
  token1Address: string;
  token0Symbol: string | null;
  token1Symbol: string | null;
  createdAtBlock: bigint;
  currencyPair: string;
}

export interface CheckpointRecord {
  id: string;
  chainId: number;
  contractAddress: string;
  lastProcessedBlock: bigint;
  updatedAt: Date;
}

export interface UpsertInitializeInput {
  chainId: number;
  blockNumber: bigint;
  poolId: `0x${string}`;
  hookAddress: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  token0Symbol: string;
  token1Symbol: string;
  currencyPair: string;
  fee: number;
  tickSpacing: number;
}

export interface UpsertInitializeResult {
  createdHook: boolean;
  createdPool: boolean;
  hook: HookRecord;
}

export interface HookRepository {
  upsertInitialize(input: UpsertInitializeInput): Promise<UpsertInitializeResult>;
  listHooks(filter?: { chainId?: number; limit?: number }): Promise<HookRecord[]>;
  getByAddress(
    address: string,
    chainId?: number,
  ): Promise<Array<HookRecord & { pools: PoolRecord[] }>>;
  countHooks(chainId?: number): Promise<number>;
  countPools(chainId?: number): Promise<number>;
  getCheckpoint(
    chainId: number,
    contractAddress: string,
  ): Promise<CheckpointRecord | null>;
  saveCheckpoint(
    chainId: number,
    contractAddress: string,
    lastProcessedBlock: bigint,
  ): Promise<void>;
}

const UNKNOWN_CREATOR = '0x0000000000000000000000000000000000000000';

function normalize(value: string): string {
  return value.toLowerCase();
}

export class InMemoryHookRepository implements HookRepository {
  readonly hooks = new Map<string, HookRecord>();
  readonly pools = new Map<string, PoolRecord>();
  readonly checkpoints = new Map<string, CheckpointRecord>();

  private hookKey(chainId: number, address: string): string {
    return `${chainId}:${normalize(address)}`;
  }

  private poolKey(chainId: number, poolId: string): string {
    return `${chainId}:${normalize(poolId)}`;
  }

  private checkpointKey(chainId: number, contractAddress: string): string {
    return `${chainId}:${normalize(contractAddress)}`;
  }

  async upsertInitialize(input: UpsertInitializeInput): Promise<UpsertInitializeResult> {
    const hookAddress = normalize(input.hookAddress);
    const hKey = this.hookKey(input.chainId, hookAddress);
    const pKey = this.poolKey(input.chainId, input.poolId);

    let hook = this.hooks.get(hKey);
    let createdHook = false;
    const now = new Date();

    if (!hook) {
      createdHook = true;
      hook = {
        id: randomUUID(),
        address: hookAddress,
        chainId: input.chainId,
        creator: UNKNOWN_CREATOR,
        deploymentBlock: input.blockNumber,
        verifiedSource: false,
        riskScore: null,
        createdAt: now,
        firstSeenBlock: input.blockNumber,
        lastSeenBlock: input.blockNumber,
        poolCount: 0,
        lastIndexedAt: now,
      };
    } else {
      hook = {
        ...hook,
        lastSeenBlock:
          input.blockNumber > hook.lastSeenBlock ? input.blockNumber : hook.lastSeenBlock,
        lastIndexedAt: now,
      };
    }

    let createdPool = false;
    if (!this.pools.has(pKey)) {
      createdPool = true;
      const token0 = normalize(input.token0);
      const token1 = normalize(input.token1);
      this.pools.set(pKey, {
        id: randomUUID(),
        poolId: normalize(input.poolId),
        chainId: input.chainId,
        hookAddress,
        token0,
        token1,
        fee: input.fee,
        tickSpacing: input.tickSpacing,
        createdBlock: input.blockNumber,
        token0Address: token0,
        token1Address: token1,
        token0Symbol: input.token0Symbol,
        token1Symbol: input.token1Symbol,
        createdAtBlock: input.blockNumber,
        currencyPair: input.currencyPair,
      });
    }

    hook.poolCount = [...this.pools.values()].filter(
      (pool) => pool.chainId === input.chainId && pool.hookAddress === hookAddress,
    ).length;
    this.hooks.set(hKey, hook);

    return { createdHook, createdPool, hook };
  }

  async listHooks(filter: { chainId?: number; limit?: number } = {}): Promise<HookRecord[]> {
    let rows = [...this.hooks.values()];
    if (filter.chainId !== undefined) {
      rows = rows.filter((hook) => hook.chainId === filter.chainId);
    }
    rows.sort((a, b) => {
      const aTime = a.lastIndexedAt?.getTime() ?? 0;
      const bTime = b.lastIndexedAt?.getTime() ?? 0;
      return bTime - aTime;
    });
    return rows.slice(0, filter.limit ?? 200);
  }

  async getByAddress(
    address: string,
    chainId?: number,
  ): Promise<Array<HookRecord & { pools: PoolRecord[] }>> {
    const target = normalize(address);
    const hooks = [...this.hooks.values()].filter((hook) => {
      if (hook.address !== target) return false;
      if (chainId !== undefined && hook.chainId !== chainId) return false;
      return true;
    });

    return hooks.map((hook) => ({
      ...hook,
      pools: [...this.pools.values()].filter(
        (pool) => pool.chainId === hook.chainId && pool.hookAddress === hook.address,
      ),
    }));
  }

  async countHooks(chainId?: number): Promise<number> {
    return [...this.hooks.values()].filter((hook) =>
      chainId === undefined ? true : hook.chainId === chainId,
    ).length;
  }

  async countPools(chainId?: number): Promise<number> {
    return [...this.pools.values()].filter((pool) =>
      chainId === undefined ? true : pool.chainId === chainId,
    ).length;
  }

  async getCheckpoint(
    chainId: number,
    contractAddress: string,
  ): Promise<CheckpointRecord | null> {
    return this.checkpoints.get(this.checkpointKey(chainId, contractAddress)) ?? null;
  }

  async saveCheckpoint(
    chainId: number,
    contractAddress: string,
    lastProcessedBlock: bigint,
  ): Promise<void> {
    const key = this.checkpointKey(chainId, contractAddress);
    const existing = this.checkpoints.get(key);
    if (existing && lastProcessedBlock < existing.lastProcessedBlock) {
      return;
    }
    this.checkpoints.set(key, {
      id: existing?.id ?? randomUUID(),
      chainId,
      contractAddress: normalize(contractAddress),
      lastProcessedBlock,
      updatedAt: new Date(),
    });
  }
}

export class PrismaHookRepository implements HookRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertInitialize(input: UpsertInitializeInput): Promise<UpsertInitializeResult> {
    const hookAddress = normalize(input.hookAddress);
    const poolId = normalize(input.poolId);
    const token0 = normalize(input.token0);
    const token1 = normalize(input.token1);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const existingHook = await tx.hook.findUnique({
        where: { address_chainId: { address: hookAddress, chainId: input.chainId } },
      });

      const hook = await tx.hook.upsert({
        where: { address_chainId: { address: hookAddress, chainId: input.chainId } },
        create: {
          address: hookAddress,
          chainId: input.chainId,
          creator: UNKNOWN_CREATOR,
          deploymentBlock: input.blockNumber,
          verifiedSource: false,
          firstSeenBlock: input.blockNumber,
          lastSeenBlock: input.blockNumber,
          poolCount: 0,
          lastIndexedAt: now,
        },
        update: {
          lastSeenBlock:
            !existingHook || input.blockNumber > existingHook.lastSeenBlock
              ? input.blockNumber
              : existingHook.lastSeenBlock,
          lastIndexedAt: now,
        },
      });

      const existingPool = await tx.pool.findUnique({
        where: { poolId_chainId: { poolId, chainId: input.chainId } },
      });

      if (!existingPool) {
        await tx.pool.create({
          data: {
            poolId,
            chainId: input.chainId,
            hookAddress,
            token0,
            token1,
            fee: input.fee,
            tickSpacing: input.tickSpacing,
            createdBlock: input.blockNumber,
            token0Address: token0,
            token1Address: token1,
            token0Symbol: input.token0Symbol,
            token1Symbol: input.token1Symbol,
            createdAtBlock: input.blockNumber,
            currencyPair: input.currencyPair,
          },
        });
      }

      const poolCount = await tx.pool.count({
        where: { hookAddress, chainId: input.chainId },
      });

      const updated = await tx.hook.update({
        where: { id: hook.id },
        data: { poolCount },
      });

      return {
        createdHook: !existingHook,
        createdPool: !existingPool,
        hook: toHookRecord(updated),
      };
    });
  }

  async listHooks(filter: { chainId?: number; limit?: number } = {}): Promise<HookRecord[]> {
    const rows = await this.prisma.hook.findMany({
      where: filter.chainId !== undefined ? { chainId: filter.chainId } : undefined,
      orderBy: [{ lastIndexedAt: 'desc' }, { address: 'asc' }],
      take: filter.limit ?? 200,
    });
    return rows.map(toHookRecord);
  }

  async getByAddress(
    address: string,
    chainId?: number,
  ): Promise<Array<HookRecord & { pools: PoolRecord[] }>> {
    const rows = await this.prisma.hook.findMany({
      where: {
        address: normalize(address),
        ...(chainId !== undefined ? { chainId } : {}),
      },
      include: { pools: true },
    });

    return rows.map((row) => ({
      ...toHookRecord(row),
      pools: row.pools.map(toPoolRecord),
    }));
  }

  async countHooks(chainId?: number): Promise<number> {
    return this.prisma.hook.count({
      where: chainId !== undefined ? { chainId } : undefined,
    });
  }

  async countPools(chainId?: number): Promise<number> {
    return this.prisma.pool.count({
      where: chainId !== undefined ? { chainId } : undefined,
    });
  }

  async getCheckpoint(
    chainId: number,
    contractAddress: string,
  ): Promise<CheckpointRecord | null> {
    const row = await this.prisma.indexerCheckpoint.findUnique({
      where: {
        chainId_contractAddress: {
          chainId,
          contractAddress: normalize(contractAddress),
        },
      },
    });
    return row ? toCheckpointRecord(row) : null;
  }

  async saveCheckpoint(
    chainId: number,
    contractAddress: string,
    lastProcessedBlock: bigint,
  ): Promise<void> {
    const normalized = normalize(contractAddress);
    const existing = await this.prisma.indexerCheckpoint.findUnique({
      where: {
        chainId_contractAddress: { chainId, contractAddress: normalized },
      },
    });

    if (existing && lastProcessedBlock < existing.lastProcessedBlock) {
      return;
    }

    await this.prisma.indexerCheckpoint.upsert({
      where: {
        chainId_contractAddress: { chainId, contractAddress: normalized },
      },
      create: {
        chainId,
        contractAddress: normalized,
        lastProcessedBlock,
      },
      update: { lastProcessedBlock },
    });
  }
}

function toHookRecord(row: {
  id: string;
  address: string;
  chainId: number;
  creator: string;
  deploymentBlock: bigint;
  verifiedSource: boolean;
  riskScore: number | null;
  createdAt: Date;
  firstSeenBlock: bigint;
  lastSeenBlock: bigint;
  poolCount: number;
  lastIndexedAt: Date | null;
}): HookRecord {
  return { ...row };
}

function toPoolRecord(row: {
  id: string;
  poolId: string;
  chainId: number;
  hookAddress: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  createdBlock: bigint;
  token0Address: string;
  token1Address: string;
  token0Symbol: string | null;
  token1Symbol: string | null;
  createdAtBlock: bigint;
  currencyPair: string;
}): PoolRecord {
  return { ...row };
}

function toCheckpointRecord(row: {
  id: string;
  chainId: number;
  contractAddress: string;
  lastProcessedBlock: bigint;
  updatedAt: Date;
}): CheckpointRecord {
  return { ...row };
}
