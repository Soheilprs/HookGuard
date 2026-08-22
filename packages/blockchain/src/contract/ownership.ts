import { getAddress, zeroAddress, type Address } from 'viem';
import type { ReadOnlyClient } from '../uniswap-v4/index.js';

export interface PermissionFact {
  type: string;
  address: Address;
  source: string;
}

const ownerAbi = [
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const;

const adminAbi = [
  {
    type: 'function',
    name: 'admin',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const;

const roleMemberCountAbi = [
  {
    type: 'function',
    name: 'getRoleMemberCount',
    stateMutability: 'view',
    inputs: [{ name: 'role', type: 'bytes32' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const roleMemberAbi = [
  {
    type: 'function',
    name: 'getRoleMember',
    stateMutability: 'view',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ type: 'address' }],
  },
] as const;

export const DEFAULT_ADMIN_ROLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

export async function detectPermissions(
  client: Pick<ReadOnlyClient, 'readContract'>,
  address: Address,
): Promise<PermissionFact[]> {
  const facts: PermissionFact[] = [];
  const owner = await readAddress(client, address, ownerAbi, 'owner');
  if (owner) {
    facts.push({ type: 'owner', address: owner, source: 'owner()' });
  }

  const admin = await readAddress(client, address, adminAbi, 'admin');
  if (admin) {
    facts.push({ type: 'admin', address: admin, source: 'admin()' });
  }

  const roleHolders = await readDefaultAdmins(client, address);
  for (const holder of roleHolders) {
    if (facts.some((fact) => fact.address === holder && fact.type === 'default_admin_role')) {
      continue;
    }
    facts.push({
      type: 'default_admin_role',
      address: holder,
      source: 'AccessControl.getRoleMember(DEFAULT_ADMIN_ROLE)',
    });
  }

  return facts;
}

async function readAddress(
  client: Pick<ReadOnlyClient, 'readContract'>,
  address: Address,
  abi: readonly unknown[],
  functionName: string,
): Promise<Address | null> {
  try {
    const value = await client.readContract({ address, abi, functionName });
    if (typeof value !== 'string' || !value.startsWith('0x')) return null;
    const parsed = getAddress(value);
    return parsed === zeroAddress ? null : parsed;
  } catch {
    return null;
  }
}

async function readDefaultAdmins(
  client: Pick<ReadOnlyClient, 'readContract'>,
  address: Address,
): Promise<Address[]> {
  try {
    const countRaw = await client.readContract({
      address,
      abi: roleMemberCountAbi,
      functionName: 'getRoleMemberCount',
      args: [DEFAULT_ADMIN_ROLE],
    });
    const count = Number(countRaw);
    if (!Number.isFinite(count) || count <= 0) return [];
    const limit = Math.min(count, 10);
    const members: Address[] = [];
    for (let index = 0; index < limit; index += 1) {
      const member = await client.readContract({
        address,
        abi: roleMemberAbi,
        functionName: 'getRoleMember',
        args: [DEFAULT_ADMIN_ROLE, BigInt(index)],
      });
      if (typeof member === 'string' && member.startsWith('0x')) {
        const parsed = getAddress(member);
        if (parsed !== zeroAddress) members.push(parsed);
      }
    }
    return members;
  } catch {
    return [];
  }
}
