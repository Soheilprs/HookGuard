import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  exportInteractionJson,
  exportInteractionMarkdown,
  listSupportedChains,
  renderBehaviorLandscape,
  renderExternalInteractionAnalysis,
  renderInteractionCaseStudies,
  type SupportedChainId,
} from '@hookguard/blockchain';
import { generateInteractionReport } from '../modules/research/interaction-research.service.js';
import { PrismaContractRepository } from '../modules/contracts/contract.repository.js';
import { PrismaFindingRepository } from '../modules/findings/finding.repository.js';
import { runHookAnalysis } from '../modules/findings/analyzer.worker.js';
import { PrismaHookRepository } from '../modules/hooks/hook.repository.js';
import { prisma } from '../lib/prisma.js';

async function main(): Promise<void> {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
  const reportsDir = join(root, 'reports');
  const docsDir = join(root, 'docs/research');
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(docsDir, { recursive: true });

  console.info('HookGuard interaction analysis (read-only, no scores)');

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

  const report = await generateInteractionReport();
  writeFileSync(join(reportsDir, 'hookguard-interaction-analysis.json'), exportInteractionJson(report));
  writeFileSync(join(reportsDir, 'hookguard-interaction-analysis.md'), exportInteractionMarkdown(report));
  writeFileSync(join(docsDir, 'HOOK_EXTERNAL_INTERACTION_ANALYSIS.md'), renderExternalInteractionAnalysis(report));
  writeFileSync(join(docsDir, 'HOOK_BEHAVIOR_LANDSCAPE.md'), renderBehaviorLandscape(report));
  writeFileSync(join(docsDir, 'HOOK_INTERACTION_CASE_STUDIES.md'), renderInteractionCaseStudies(report));

  console.info(
    `calls=${report.metrics.callbackExternalCalls} erc20=${report.metrics.erc20Interactions} unknown=${report.metrics.unknownTargets} user=${report.metrics.userControlled} protocol=${report.metrics.knownProtocols} cases=${report.caseStudies.length}`,
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
