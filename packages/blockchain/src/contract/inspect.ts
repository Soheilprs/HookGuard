import { getAddress, type Address } from 'viem';
import type { ReadOnlyClient } from '../uniswap-v4/index.js';
import { functionsFromAbi, functionsFromBytecode, mergeFunctions, type ParsedFunction } from './abi.js';
import { byteLength, fetchBytecode, type BytecodeSnapshot } from './bytecode.js';
import { detectPermissions, type PermissionFact } from './ownership.js';
import { detectProxy, type ProxyFacts } from './proxy.js';
import { EMPTY_SOURCE, type SourceProvider, type VerifiedSource } from './source.js';

export interface ContractIntelligenceFacts {
  snapshot: BytecodeSnapshot;
  proxy: ProxyFacts;
  source: VerifiedSource;
  functions: ParsedFunction[];
  permissions: PermissionFact[];
}

export async function collectContractIntelligence(
  client: ReadOnlyClient,
  sourceProvider: SourceProvider,
  address: Address,
  chainId: number,
): Promise<ContractIntelligenceFacts> {
  const checksum = getAddress(address);
  const snapshot = await fetchBytecode(client, checksum);
  const proxy = await detectProxy(client, checksum, snapshot.bytecode);

  let source = EMPTY_SOURCE;
  try {
    source = await sourceProvider.getVerifiedSource(chainId, checksum);
    if (!source.sourceVerified && proxy.implementationAddress) {
      source = await sourceProvider.getVerifiedSource(
        chainId,
        proxy.implementationAddress,
      );
    }
  } catch {
    source = EMPTY_SOURCE;
  }

  const abiFunctions = source.abi ? functionsFromAbi(source.abi) : [];
  const bytecodeFunctions = functionsFromBytecode(
    snapshot.empty && proxy.implementationAddress
      ? ((await fetchBytecode(client, proxy.implementationAddress)).bytecode)
      : snapshot.bytecode,
  );
  const functions = mergeFunctions(abiFunctions, bytecodeFunctions);

  const permissions = [...(await detectPermissions(client, checksum))];
  if (proxy.adminAddress) {
    permissions.push({
      type: 'proxy_admin',
      address: proxy.adminAddress,
      source: 'eip1967.proxy.admin',
    });
  }
  if (proxy.implementationAddress) {
    const implOwner = await detectPermissions(client, proxy.implementationAddress);
    for (const fact of implOwner) {
      permissions.push({
        ...fact,
        source: `implementation.${fact.source}`,
      });
    }
  }

  return {
    snapshot: {
      ...snapshot,
      bytecodeSize: byteLength(snapshot.bytecode),
    },
    proxy,
    source,
    functions,
    permissions: dedupePermissions(permissions),
  };
}

function dedupePermissions(facts: PermissionFact[]): PermissionFact[] {
  const seen = new Set<string>();
  const unique: PermissionFact[] = [];
  for (const fact of facts) {
    const key = `${fact.type}:${fact.address.toLowerCase()}:${fact.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(fact);
  }
  return unique;
}
