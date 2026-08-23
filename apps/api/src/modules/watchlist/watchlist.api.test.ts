import { getAddress } from 'viem';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import { InMemoryContractRepository } from '../contracts/contract.repository.js';
import { ContractService } from '../contracts/contract.service.js';
import { InMemoryFindingRepository } from '../findings/finding.repository.js';
import { FindingService } from '../findings/finding.service.js';
import { InMemoryHookRepository } from '../hooks/hook.repository.js';
import { HookService } from '../hooks/hook.service.js';
import { InMemoryMonitoringRepository } from '../monitoring/repository.js';
import { MonitoringService } from '../monitoring/service.js';
import { InMemoryAlertRepository } from '../alerts/alert.repository.js';
import { AlertService } from '../alerts/alert.service.js';
import { TelegramNotifier } from '../alerts/telegram.js';
import { createPublicHookService } from '../public/public.service.js';
import { InMemoryWatchlistRepository } from './repository.js';
import { WatchlistService } from './service.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const POOL =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;

const hooks = new InMemoryHookRepository();
const contracts = new InMemoryContractRepository();
const findings = new InMemoryFindingRepository();
const monitoring = new InMemoryMonitoringRepository();
const watches = new InMemoryWatchlistRepository();
const alerts = new InMemoryAlertRepository();
const notifier = new TelegramNotifier('', '');
const app = await buildApp({
  hookService: new HookService(hooks),
  contractService: new ContractService(contracts, hooks),
  findingService: new FindingService(findings, hooks),
  monitoringService: new MonitoringService(monitoring, hooks),
  watchlistService: new WatchlistService(watches, hooks),
  alertService: new AlertService(alerts, watches, monitoring, hooks, notifier),
  publicHookService: createPublicHookService(hooks, contracts, findings, monitoring, watches),
});

beforeAll(async () => {
  await hooks.upsertInitialize({
    chainId: 1,
    blockNumber: 1n,
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

describe('watchlist API', () => {
  it('adds, lists, and removes a watch', async () => {
    const created = await app.inject({
      method: 'POST',
      url: `/hooks/${HOOK}/watch`,
      payload: { identifier: 'tester', eventTypes: ['IMPLEMENTATION_CHANGED'] },
    });
    expect(created.statusCode).toBe(200);
    const createdBody = created.json() as { watched: boolean; watchlist: { identifier: string } };
    expect(createdBody.watched).toBe(true);
    expect(createdBody.watchlist.identifier).toBe('tester');

    const alertsForHook = await app.inject({
      method: 'GET',
      url: `/hooks/${HOOK}/alerts?identifier=tester`,
    });
    expect(alertsForHook.statusCode).toBe(200);

    const listed = await app.inject({
      method: 'GET',
      url: '/watchlist?identifier=tester',
    });
    expect(listed.statusCode).toBe(200);
    const listBody = listed.json() as { watchlists: Array<{ hook: { address: string } }> };
    expect(listBody.watchlists).toHaveLength(1);
    expect(listBody.watchlists[0]?.hook.address.toLowerCase()).toBe(HOOK.toLowerCase());

    const removed = await app.inject({
      method: 'DELETE',
      url: `/hooks/${HOOK}/watch?identifier=tester`,
    });
    expect(removed.statusCode).toBe(200);
    expect(removed.json()).toMatchObject({ watched: false });

    const empty = await app.inject({
      method: 'GET',
      url: '/watchlist?identifier=tester',
    });
    expect(empty.json()).toMatchObject({ watchlists: [] });
  });
});
