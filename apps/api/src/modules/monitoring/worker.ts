import {
  buildMonitorSnapshot,
  collectContractIntelligence,
  compareSnapshots,
  createDefaultSourceProvider,
  type ReadOnlyClient,
  type SourceProvider,
} from '@hookguard/blockchain';
import { getAddress } from 'viem';
import type { ContractRecord, ContractRepository } from '../contracts/contract.repository.js';
import type { HookRepository } from '../hooks/hook.repository.js';
import { monitorSnapshotFromRecord, type MonitoringRepository } from './repository.js';

export interface MonitorOptions {
  chainId: number;
  hooks: HookRepository;
  contracts: ContractRepository;
  monitoring: MonitoringRepository;
  client?: ReadOnlyClient;
  sourceProvider?: SourceProvider;
  address?: `0x${string}`;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

export interface MonitorResult {
  chainId: number;
  monitored: number;
  skipped: number;
  snapshots: number;
  events: number;
}

export async function runHookMonitoring(options: MonitorOptions): Promise<MonitorResult> {
  const log = options.logger ?? console;
  const targets = options.address
    ? await options.hooks.getByAddress(options.address, options.chainId)
    : await options.hooks.listHooks({ chainId: options.chainId, limit: 10_000 });

  const result: MonitorResult = {
    chainId: options.chainId,
    monitored: 0,
    skipped: 0,
    snapshots: 0,
    events: 0,
  };

  for (const hook of targets) {
    const [stored] = await options.contracts.getByAddress(hook.address, hook.chainId);
    const previousRow = await options.monitoring.latestSnapshot(hook.id);
    const previous = previousRow ? monitorSnapshotFromRecord(previousRow) : null;

    let contract = stored;
    let blockNumber = previousRow ? previousRow.blockNumber + 1n : hook.lastSeenBlock;

    if (options.client) {
      try {
        const facts = await collectContractIntelligence(
          options.client,
          options.sourceProvider ?? createDefaultSourceProvider(),
          getAddress(hook.address),
          hook.chainId,
        );
        contract = await options.contracts.save({
          address: hook.address,
          chainId: hook.chainId,
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
        blockNumber = await options.client.getBlockNumber();
      } catch (error) {
        result.skipped += 1;
        log.warn(
          `[monitor] failed ${hook.address} chain=${hook.chainId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        continue;
      }
    }

    if (!contract) {
      result.skipped += 1;
      continue;
    }

    const current = snapshotFromContract(hook.id, contract, blockNumber);
    const changes = compareSnapshots(previous, current);
    const committed = await options.monitoring.commit(current, changes);
    result.monitored += 1;
    result.snapshots += 1;
    result.events += committed.events.length;
  }

  log.info(
    `[monitor] chain ${options.chainId} monitored=${result.monitored} skipped=${result.skipped} snapshots=${result.snapshots} events=${result.events}`,
  );
  return result;
}

function snapshotFromContract(
  hookId: string,
  contract: ContractRecord,
  blockNumber: bigint,
) {
  return buildMonitorSnapshot({
    hookId,
    blockNumber,
    implementationAddress: contract.implementationAddress,
    adminAddress: contract.adminAddress,
    bytecodeHash: contract.bytecodeHash,
    functions: contract.functions,
    permissions: contract.permissions,
  });
}
