import 'dotenv/config';
import {
  createDefaultSourceProvider,
  createReadOnlyClient,
  getChainById,
  getChainBySlug,
  listSupportedChains,
  rpcUrlForSupportedChain,
  type SupportedChainId,
} from '@hookguard/blockchain';
import { PrismaContractRepository } from '../modules/contracts/contract.repository.js';
import { PrismaHookRepository } from '../modules/hooks/hook.repository.js';
import { createAlertService } from '../modules/alerts/alert.service.js';
import { PrismaMonitoringRepository } from '../modules/monitoring/repository.js';
import { scheduleHookMonitoring } from '../modules/monitoring/scheduler.js';
import { prisma } from '../lib/prisma.js';

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (const part of argv) {
    if (!part.startsWith('--')) continue;
    const [key, raw] = part.slice(2).split('=');
    if (key) args.set(key, raw ?? 'true');
  }

  const chainArg = args.get('chain');
  const chainIds: SupportedChainId[] = chainArg
    ? [resolveChainId(chainArg)]
    : listSupportedChains().map((chain) => chain.id as SupportedChainId);

  return {
    chainIds,
    address: args.get('address') as `0x${string}` | undefined,
  };
}

function resolveChainId(value: string): SupportedChainId {
  if (/^\d+$/.test(value)) {
    const chain = getChainById(Number(value));
    if (!chain) throw new Error(`Unsupported chain id: ${value}`);
    return chain.id as SupportedChainId;
  }
  const chain = getChainBySlug(value);
  if (!chain) throw new Error(`Unknown chain: ${value}`);
  return chain.id as SupportedChainId;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const hooks = new PrismaHookRepository(prisma);
  const contracts = new PrismaContractRepository(prisma);
  const monitoring = new PrismaMonitoringRepository(prisma);
  const alerts = createAlertService();
  const sourceProvider = createDefaultSourceProvider();

  console.info('HookGuard continuous monitoring (read-only, no scores, no transactions)');

  for (const chainId of options.chainIds) {
    const url = rpcUrlForSupportedChain(chainId);
    const client = createReadOnlyClient(chainId, url);
    await scheduleHookMonitoring({
      chainIds: [chainId],
      hooks,
      contracts,
      monitoring,
      client,
      sourceProvider,
      alerts,
      address: options.address,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
