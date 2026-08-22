import {
  collectContractIntelligence,
  type ReadOnlyClient,
  type SourceProvider,
} from '@hookguard/blockchain';
import { getAddress } from 'viem';
import type { HookRepository } from '../hooks/hook.repository.js';
import type { ContractRepository } from './contract.repository.js';

export interface ContractInspectOptions {
  chainId: number;
  client: ReadOnlyClient;
  sourceProvider: SourceProvider;
  contracts: ContractRepository;
  hooks: HookRepository;
  address?: `0x${string}`;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

export interface ContractInspectResult {
  chainId: number;
  inspected: number;
  verified: number;
  proxies: number;
  failed: number;
}

export async function runContractIntelligence(
  options: ContractInspectOptions,
): Promise<ContractInspectResult> {
  const log = options.logger ?? console;
  const targets = options.address
    ? [{ address: options.address.toLowerCase(), chainId: options.chainId }]
    : (await options.hooks.listHooks({ chainId: options.chainId, limit: 5_000 })).map(
        (hook) => ({ address: hook.address, chainId: hook.chainId }),
      );

  const result: ContractInspectResult = {
    chainId: options.chainId,
    inspected: 0,
    verified: 0,
    proxies: 0,
    failed: 0,
  };

  for (const target of targets) {
    try {
      const facts = await collectContractIntelligence(
        options.client,
        options.sourceProvider,
        getAddress(target.address),
        target.chainId,
      );

      await options.contracts.save({
        address: target.address,
        chainId: target.chainId,
        bytecode: facts.snapshot.bytecode,
        sourceCode: facts.source.sourceCode,
        compilerVersion: facts.source.compilerVersion,
        bytecodeHash: facts.snapshot.bytecodeHash,
        sourceVerified: facts.source.sourceVerified,
        sourceUrl: facts.source.sourceUrl,
        abiJson: facts.source.abi ? JSON.stringify(facts.source.abi) : null,
        isProxy: facts.proxy.isProxy,
        implementationAddress: facts.proxy.implementationAddress,
        adminAddress: facts.proxy.adminAddress,
        functions: facts.functions,
        permissions: facts.permissions,
      });

      if (facts.source.sourceVerified) {
        await options.hooks.setVerifiedSource(target.address, target.chainId, true);
        result.verified += 1;
      }
      if (facts.proxy.isProxy) result.proxies += 1;
      result.inspected += 1;
    } catch (error) {
      result.failed += 1;
      log.warn(
        `[contracts] ${target.address} on ${target.chainId} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  log.info(
    `[contracts] chain ${options.chainId} inspected=${result.inspected} verified=${result.verified} proxies=${result.proxies} failed=${result.failed}`,
  );
  return result;
}
