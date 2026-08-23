import type { SupportedChainId } from '@hookguard/blockchain';
import { runHookMonitoring, type MonitorOptions, type MonitorResult } from './worker.js';

export interface MonitorScheduleOptions extends Omit<MonitorOptions, 'chainId'> {
  chainIds: SupportedChainId[];
}

/**
 * Manual monitoring scheduler. Invoke via `npm run monitor:hooks`.
 * No production cron is required.
 */
export async function scheduleHookMonitoring(
  options: MonitorScheduleOptions,
): Promise<MonitorResult[]> {
  const results: MonitorResult[] = [];
  for (const chainId of options.chainIds) {
    results.push(
      await runHookMonitoring({
        ...options,
        chainId,
      }),
    );
  }
  return results;
}
