import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  exportBytecodeResearchJson,
  exportBytecodeResearchMarkdown,
  listSupportedChains,
  type SupportedChainId,
} from '@hookguard/blockchain';
import { generateBytecodeResearchReport } from '../modules/research/bytecode-research.service.js';
import { PrismaContractRepository } from '../modules/contracts/contract.repository.js';
import { PrismaFindingRepository } from '../modules/findings/finding.repository.js';
import { runHookAnalysis } from '../modules/findings/analyzer.worker.js';
import { PrismaHookRepository } from '../modules/hooks/hook.repository.js';
import { prisma } from '../lib/prisma.js';

async function main(): Promise<void> {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
  const outDir = join(root, 'reports');
  mkdirSync(outDir, { recursive: true });

  console.info('HookGuard bytecode CFG analysis (read-only, no scores)');

  const hooks = new PrismaHookRepository(prisma);
  const contracts = new PrismaContractRepository(prisma);
  const findings = new PrismaFindingRepository(prisma);

  for (const chain of listSupportedChains()) {
    await runHookAnalysis({
      chainId: chain.id as SupportedChainId,
      hooks,
      contracts,
      findings,
      logger: console,
    });
  }

  const report = await generateBytecodeResearchReport();
  const jsonPath = join(outDir, 'bytecode-analysis-results.json');
  const mdPath = join(outDir, 'bytecode-analysis-results.md');
  writeFileSync(jsonPath, exportBytecodeResearchJson(report));
  writeFileSync(mdPath, exportBytecodeResearchMarkdown(report));
  console.info(`Wrote ${jsonPath}`);
  console.info(`Wrote ${mdPath}`);
  console.info(
    `opcodeDelegatecall=${report.metrics.opcodeDelegatecallHooks} reachableDelegatecall=${report.metrics.reachableDelegatecallHooks} call=${report.metrics.reachableCallHooks} sstore=${report.metrics.reachableSstoreHooks}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
