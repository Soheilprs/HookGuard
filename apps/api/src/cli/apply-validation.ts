import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseValidationDataset } from '@hookguard/blockchain';
import { PrismaFindingRepository } from '../modules/findings/finding.repository.js';
import { PrismaHookRepository } from '../modules/hooks/hook.repository.js';
import { prisma } from '../lib/prisma.js';

async function main(): Promise<void> {
  const datasetPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../data/validation/dataset.json',
  );
  const dataset = parseValidationDataset(JSON.parse(readFileSync(datasetPath, 'utf8')));
  const hooks = new PrismaHookRepository(prisma);
  const findings = new PrismaFindingRepository(prisma);

  let applied = 0;
  for (const review of dataset.reviews) {
    const deployments = await hooks.getByAddress(review.address, review.chainId);
    for (const hook of deployments) {
      await findings.applyReview({
        hookId: hook.id,
        ruleId: review.ruleId,
        status: review.status,
        notes: review.notes,
      });
      applied += 1;
    }
  }
  console.info(`Applied ${applied} validation reviews (not auto-confirmed).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
