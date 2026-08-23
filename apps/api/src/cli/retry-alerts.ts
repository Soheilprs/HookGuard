import 'dotenv/config';
import { createAlertService } from '../modules/alerts/alert.service.js';
import { prisma } from '../lib/prisma.js';

async function main(): Promise<void> {
  const alerts = createAlertService();
  console.info('HookGuard alert retry (read-only chain access, Telegram optional)');
  const result = await alerts.retryPending();
  console.info(
    `[alerts] considered=${result.considered} delivered=${result.delivered} pending=${result.pending} failed=${result.failed} skipped=${result.skipped}`,
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
