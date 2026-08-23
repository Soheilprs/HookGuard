import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportLandscapeJson, exportLandscapeMarkdown } from '@hookguard/blockchain';
import { generateLandscapeReport } from '../modules/research/research.service.js';
import { prisma } from '../lib/prisma.js';

async function main(): Promise<void> {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
  const outDir = join(root, 'reports');
  mkdirSync(outDir, { recursive: true });

  console.info('HookGuard landscape report (read-only, no scores)');
  const report = await generateLandscapeReport();
  const jsonPath = join(outDir, 'hookguard-security-landscape.json');
  const mdPath = join(outDir, 'hookguard-security-landscape.md');
  writeFileSync(jsonPath, exportLandscapeJson(report));
  writeFileSync(mdPath, exportLandscapeMarkdown(report));
  console.info(`Wrote ${jsonPath}`);
  console.info(`Wrote ${mdPath}`);
  console.info(
    `hooks=${report.metrics.coverage.hooksAnalyzed} pools=${report.metrics.coverage.poolsIndexed} findings=${report.metrics.coverage.findings}`,
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
