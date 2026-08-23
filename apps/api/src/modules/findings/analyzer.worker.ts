import {
  engineRuleIds,
  fetchBytecode,
  runAnalysis,
  type AnalysisInput,
  type ReadOnlyClient,
} from '@hookguard/blockchain';
import { getAddress } from 'viem';
import type { ContractRepository } from '../contracts/contract.repository.js';
import type { HookRepository } from '../hooks/hook.repository.js';
import type { FindingRepository } from './finding.repository.js';

export interface AnalyzeOptions {
  chainId: number;
  hooks: HookRepository;
  contracts: ContractRepository;
  findings: FindingRepository;
  client?: ReadOnlyClient;
  address?: `0x${string}`;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

export interface AnalyzeResult {
  chainId: number;
  analyzed: number;
  skipped: number;
  findingCount: number;
}

export async function runHookAnalysis(options: AnalyzeOptions): Promise<AnalyzeResult> {
  const log = options.logger ?? console;
  const targets = options.address
    ? await options.hooks.getByAddress(options.address, options.chainId)
    : await options.hooks.listHooks({ chainId: options.chainId, limit: 5_000 });

  const result: AnalyzeResult = {
    chainId: options.chainId,
    analyzed: 0,
    skipped: 0,
    findingCount: 0,
  };

  const ruleIds = engineRuleIds();

  for (const hook of targets) {
    const [contract] = await options.contracts.getByAddress(hook.address, hook.chainId);
    if (!contract) {
      result.skipped += 1;
      continue;
    }

    const related = collectRelatedAddresses(contract);
    const codeEmpty: Record<string, boolean> = {
      [hook.address.toLowerCase()]:
        contract.bytecode === '0x' || contract.bytecode.length <= 2,
    };

    if (options.client) {
      for (const address of related) {
        try {
          const snapshot = await fetchBytecode(options.client, getAddress(address));
          codeEmpty[address] = snapshot.empty;
        } catch {
          // Missing code is not evidence; skip EOA conclusions for this address.
        }
      }
    }

    const input: AnalysisInput = {
      hookAddress: getAddress(hook.address),
      chainId: hook.chainId,
      bytecode: (contract.bytecode.startsWith('0x')
        ? contract.bytecode
        : `0x${contract.bytecode}`) as `0x${string}`,
      functions: contract.functions,
      permissions: contract.permissions,
      proxy: {
        isProxy: contract.isProxy,
        kind: contract.isProxy
          ? contract.adminAddress
            ? 'transparent'
            : 'eip-1967'
          : 'none',
        implementationAddress: contract.implementationAddress,
        adminAddress: contract.adminAddress,
      },
      codeEmpty,
    };

    const produced = runAnalysis(input);
    await options.findings.replaceForHook(
      hook.id,
      ruleIds,
      produced.map((finding) => ({
        hookId: hook.id,
        ruleId: finding.ruleId,
        title: finding.title,
        category: finding.category,
        severity: finding.severity,
        description: finding.description,
        evidence: finding.evidence,
      })),
    );
    result.analyzed += 1;
    result.findingCount += produced.length;
  }

  log.info(
    `[analysis] chain ${options.chainId} analyzed=${result.analyzed} skipped=${result.skipped} findings=${result.findingCount}`,
  );
  return result;
}

function collectRelatedAddresses(contract: {
  adminAddress: string | null;
  implementationAddress: string | null;
  permissions: Array<{ address: string }>;
}): string[] {
  const addresses = new Set<string>();
  if (contract.adminAddress) addresses.add(contract.adminAddress.toLowerCase());
  if (contract.implementationAddress) {
    addresses.add(contract.implementationAddress.toLowerCase());
  }
  for (const permission of contract.permissions) {
    addresses.add(permission.address.toLowerCase());
  }
  return [...addresses];
}
