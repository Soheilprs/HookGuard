import { getAddress } from 'viem';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import { InMemoryAlertRepository } from '../alerts/alert.repository.js';
import { AlertService } from '../alerts/alert.service.js';
import { TelegramNotifier } from '../alerts/telegram.js';
import { InMemoryContractRepository } from '../contracts/contract.repository.js';
import { ContractService } from '../contracts/contract.service.js';
import { InMemoryFindingRepository } from '../findings/finding.repository.js';
import { FindingService } from '../findings/finding.service.js';
import { InMemoryHookRepository } from '../hooks/hook.repository.js';
import { HookService } from '../hooks/hook.service.js';
import { InMemoryMonitoringRepository } from '../monitoring/repository.js';
import { MonitoringService } from '../monitoring/service.js';
import { InMemoryWatchlistRepository } from '../watchlist/repository.js';
import { WatchlistService } from '../watchlist/service.js';
import { createPublicHookService } from './public.service.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const POOL =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;

const hooks = new InMemoryHookRepository();
const contracts = new InMemoryContractRepository();
const findings = new InMemoryFindingRepository();
const monitoring = new InMemoryMonitoringRepository();
const watches = new InMemoryWatchlistRepository();
const app = await buildApp({
  hookService: new HookService(hooks),
  contractService: new ContractService(contracts, hooks),
  findingService: new FindingService(findings, hooks),
  monitoringService: new MonitoringService(monitoring, hooks),
  watchlistService: new WatchlistService(watches, hooks),
  alertService: new AlertService(
    new InMemoryAlertRepository(),
    watches,
    monitoring,
    hooks,
    new TelegramNotifier('', ''),
  ),
  publicHookService: createPublicHookService(hooks, contracts, findings, monitoring, watches),
});

beforeAll(async () => {
  await hooks.upsertInitialize({
    chainId: 1,
    blockNumber: 10n,
    poolId: POOL,
    hookAddress: HOOK,
    token0: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    token0Symbol: 'USDC',
    token1Symbol: 'WETH',
    currencyPair: 'USDC/WETH',
    fee: 3000,
    tickSpacing: 60,
  });
});

afterAll(async () => {
  await app.close();
});

describe('public hook and recent events APIs', () => {
  it('returns a public security page payload without a risk score', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/public/hooks/${HOOK}`,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      deployments: Array<{
        hook: { address: string };
        pools: unknown[];
        findings: unknown[];
        events: unknown[];
        monitoring: { snapshotCount: number };
        watched: boolean;
      }>;
    };
    expect(body.deployments).toHaveLength(1);
    expect(body.deployments[0]?.hook.address.toLowerCase()).toBe(HOOK.toLowerCase());
    expect(body.deployments[0]?.pools).toHaveLength(1);
    expect(body.deployments[0]?.watched).toBe(false);
    expect(JSON.stringify(body)).not.toMatch(/riskScore/);
  });

  it('lists recent events', async () => {
    const response = await app.inject({ method: 'GET', url: '/events/recent' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { events: unknown[] };
    expect(Array.isArray(body.events)).toBe(true);
  });
});
