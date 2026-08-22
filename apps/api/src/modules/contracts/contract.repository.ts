import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

export interface ContractFunctionRecord {
  id: string;
  contractId: string;
  name: string;
  selector: string;
  visibility: string;
  stateMutability: string;
}

export interface ContractPermissionRecord {
  id: string;
  contractId: string;
  type: string;
  address: string;
  source: string;
}

export interface ContractRecord {
  id: string;
  address: string;
  chainId: number;
  bytecode: string;
  sourceCode: string | null;
  compilerVersion: string | null;
  bytecodeHash: string;
  sourceVerified: boolean;
  sourceUrl: string | null;
  abiJson: string | null;
  isProxy: boolean;
  implementationAddress: string | null;
  adminAddress: string | null;
  lastCheckedAt: Date | null;
  functions: ContractFunctionRecord[];
  permissions: ContractPermissionRecord[];
}

export interface SaveContractInput {
  address: string;
  chainId: number;
  bytecode: string;
  sourceCode: string | null;
  compilerVersion: string | null;
  bytecodeHash: string;
  sourceVerified: boolean;
  sourceUrl: string | null;
  abiJson: string | null;
  isProxy: boolean;
  implementationAddress: string | null;
  adminAddress: string | null;
  functions: Array<{
    name: string;
    selector: string;
    visibility: string;
    stateMutability: string;
  }>;
  permissions: Array<{
    type: string;
    address: string;
    source: string;
  }>;
}

export interface ContractRepository {
  save(input: SaveContractInput): Promise<ContractRecord>;
  getByAddress(
    address: string,
    chainId?: number,
  ): Promise<ContractRecord[]>;
}

function normalize(value: string): string {
  return value.toLowerCase();
}

export class InMemoryContractRepository implements ContractRepository {
  readonly contracts = new Map<string, ContractRecord>();

  private key(chainId: number, address: string): string {
    return `${chainId}:${normalize(address)}`;
  }

  async save(input: SaveContractInput): Promise<ContractRecord> {
    const address = normalize(input.address);
    const existing = this.contracts.get(this.key(input.chainId, address));
    const id = existing?.id ?? randomUUID();
    const now = new Date();
    const record: ContractRecord = {
      id,
      address,
      chainId: input.chainId,
      bytecode: input.bytecode,
      sourceCode: input.sourceCode,
      compilerVersion: input.compilerVersion,
      bytecodeHash: input.bytecodeHash,
      sourceVerified: input.sourceVerified,
      sourceUrl: input.sourceUrl,
      abiJson: input.abiJson,
      isProxy: input.isProxy,
      implementationAddress: input.implementationAddress
        ? normalize(input.implementationAddress)
        : null,
      adminAddress: input.adminAddress ? normalize(input.adminAddress) : null,
      lastCheckedAt: now,
      functions: input.functions.map((fn) => ({
        id: randomUUID(),
        contractId: id,
        name: fn.name,
        selector: fn.selector.toLowerCase(),
        visibility: fn.visibility,
        stateMutability: fn.stateMutability,
      })),
      permissions: input.permissions.map((permission) => ({
        id: randomUUID(),
        contractId: id,
        type: permission.type,
        address: normalize(permission.address),
        source: permission.source,
      })),
    };
    this.contracts.set(this.key(input.chainId, address), record);
    return record;
  }

  async getByAddress(address: string, chainId?: number): Promise<ContractRecord[]> {
    const target = normalize(address);
    return [...this.contracts.values()].filter((row) => {
      if (row.address !== target) return false;
      if (chainId !== undefined && row.chainId !== chainId) return false;
      return true;
    });
  }
}

export class PrismaContractRepository implements ContractRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(input: SaveContractInput): Promise<ContractRecord> {
    const address = normalize(input.address);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.contract.upsert({
        where: { address_chainId: { address, chainId: input.chainId } },
        create: {
          address,
          chainId: input.chainId,
          bytecode: input.bytecode,
          sourceCode: input.sourceCode,
          compilerVersion: input.compilerVersion,
          bytecodeHash: input.bytecodeHash,
          sourceVerified: input.sourceVerified,
          sourceUrl: input.sourceUrl,
          abiJson: input.abiJson,
          isProxy: input.isProxy,
          implementationAddress: input.implementationAddress
            ? normalize(input.implementationAddress)
            : null,
          adminAddress: input.adminAddress ? normalize(input.adminAddress) : null,
          lastCheckedAt: now,
        },
        update: {
          bytecode: input.bytecode,
          sourceCode: input.sourceCode,
          compilerVersion: input.compilerVersion,
          bytecodeHash: input.bytecodeHash,
          sourceVerified: input.sourceVerified,
          sourceUrl: input.sourceUrl,
          abiJson: input.abiJson,
          isProxy: input.isProxy,
          implementationAddress: input.implementationAddress
            ? normalize(input.implementationAddress)
            : null,
          adminAddress: input.adminAddress ? normalize(input.adminAddress) : null,
          lastCheckedAt: now,
        },
      });

      await tx.contractFunction.deleteMany({ where: { contractId: saved.id } });
      await tx.contractPermission.deleteMany({ where: { contractId: saved.id } });

      if (input.functions.length > 0) {
        await tx.contractFunction.createMany({
          data: input.functions.map((fn) => ({
            contractId: saved.id,
            name: fn.name,
            selector: fn.selector.toLowerCase(),
            visibility: fn.visibility,
            stateMutability: fn.stateMutability,
          })),
        });
      }

      if (input.permissions.length > 0) {
        await tx.contractPermission.createMany({
          data: input.permissions.map((permission) => ({
            contractId: saved.id,
            type: permission.type,
            address: normalize(permission.address),
            source: permission.source,
          })),
        });
      }

      const full = await tx.contract.findUniqueOrThrow({
        where: { id: saved.id },
        include: { functions: true, permissions: true },
      });
      return toRecord(full);
    });
  }

  async getByAddress(address: string, chainId?: number): Promise<ContractRecord[]> {
    const rows = await this.prisma.contract.findMany({
      where: {
        address: normalize(address),
        ...(chainId !== undefined ? { chainId } : {}),
      },
      include: { functions: true, permissions: true },
    });
    return rows.map(toRecord);
  }
}

function toRecord(row: {
  id: string;
  address: string;
  chainId: number;
  bytecode: string;
  sourceCode: string | null;
  compilerVersion: string | null;
  bytecodeHash: string;
  sourceVerified: boolean;
  sourceUrl: string | null;
  abiJson: string | null;
  isProxy: boolean;
  implementationAddress: string | null;
  adminAddress: string | null;
  lastCheckedAt: Date | null;
  functions: ContractFunctionRecord[];
  permissions: ContractPermissionRecord[];
}): ContractRecord {
  return {
    ...row,
    functions: row.functions,
    permissions: row.permissions,
  };
}
