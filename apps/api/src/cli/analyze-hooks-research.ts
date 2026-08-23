import 'dotenv/config';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evidenceFileName,
  exportAnalysisResearchJson,
  exportAnalysisResearchMarkdown,
  exportEvidenceMarkdown,
  listSupportedChains,
  type SupportedChainId,
} from '@hookguard/blockchain';
import { generateAnalysisResearchReport } from '../modules/research/analysis-research.service.js';
import { PrismaContractRepository } from '../modules/contracts/contract.repository.js';
import { PrismaFindingRepository } from '../modules/findings/finding.repository.js';
import { runHookAnalysis } from '../modules/findings/analyzer.worker.js';
import { PrismaHookRepository } from '../modules/hooks/hook.repository.js';
import { prisma } from '../lib/prisma.js';

async function main(): Promise<void> {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
  const outDir = join(root, 'reports');
  const evidenceDir = join(outDir, 'evidence');

  console.info('HookGuard corpus research analysis (read-only, stored facts, no scores)');
  console.info('Using Hook / Contract / bytecode / ABI / source from the database. No synthetic fixtures.');

  const hooks = new PrismaHookRepository(prisma);
  const contracts = new PrismaContractRepository(prisma);
  const findings = new PrismaFindingRepository(prisma);
  const chainIds = listSupportedChains().map((chain) => chain.id as SupportedChainId);

  for (const chainId of chainIds) {
    await runHookAnalysis({
      chainId,
      hooks,
      contracts,
      findings,
      logger: console,
    });
  }

  rmSync(evidenceDir, { recursive: true, force: true });
  mkdirSync(evidenceDir, { recursive: true });

  const report = await generateAnalysisResearchReport();
  const jsonPath = join(outDir, 'hookguard-security-analysis-results.json');
  const mdPath = join(outDir, 'hookguard-security-analysis-results.md');
  writeFileSync(jsonPath, exportAnalysisResearchJson(report));
  writeFileSync(mdPath, exportAnalysisResearchMarkdown(report));

  for (const finding of report.findings) {
    writeFileSync(join(evidenceDir, evidenceFileName(finding)), exportEvidenceMarkdown(finding));
  }

  console.info(`Wrote ${jsonPath}`);
  console.info(`Wrote ${mdPath}`);
  console.info(`Wrote ${report.findings.length} evidence files in ${evidenceDir}`);
  console.info(
    `indexed=${report.metrics.coverage.hooksIndexed} verifiedSource=${report.metrics.coverage.hooksWithVerifiedSource} analyzed=${report.metrics.coverage.hooksAnalyzed} analyzerFindings=${report.metrics.coverage.analyzerFindings}`,
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
