import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { buildMonitorSnapshot, SECURITY_EVENT_TYPES } from '@hookguard/blockchain';
import { InMemoryHookRepository } from '../hooks/hook.repository.js';
import { InMemoryMonitoringRepository } from '../monitoring/repository.js';
import { InMemoryWatchlistRepository } from '../watchlist/repository.js';
import { AlertService } from './alert.service.js';
import { InMemoryAlertRepository } from './alert.repository.js';
import { TelegramNotifier } from './telegram.js';
import type { AlertMessage } from './notifier.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const POOL = ('0x' + 'aa'.repeat(32)) as `0x${string}`;

async function seed() {
  const hooks = new InMemoryHookRepository();
  const created = await hooks.upsertInitialize({
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
  return { hooks, hookId: created.hook.id };
}

describe('alert generation', () => {
  it('stores pending alerts when Telegram is not configured', async () => {
    const { hooks, hookId } = await seed();
    const watches = new InMemoryWatchlistRepository();
    const monitoring = new InMemoryMonitoringRepository();
    const alerts = new InMemoryAlertRepository();
    const service = new AlertService(
      alerts,
      watches,
      monitoring,
      hooks,
      new TelegramNotifier('', ''),
    );

    await watches.upsert({ hookId, identifier: 'lp-1' });
    const committed = await monitoring.commit(
      buildMonitorSnapshot({
        hookId,
        blockNumber: 2n,
        implementationAddress: '0x5555555555555555555555555555555555555555',
        bytecodeHash: '0xbbbb',
        functions: [],
        permissions: [],
      }),
      [
        {
          type: SECURITY_EVENT_TYPES.IMPLEMENTATION_CHANGED,
          severity: 'high',
          confidence: 'HIGH',
          title: 'Implementation changed',
          description: 'EIP-1967 slot changed.',
          evidence: { from: '0x22', to: '0x55' },
        },
      ],
    );

    const first = await service.dispatch(committed.events);
    expect(first.pending).toBe(1);
    expect(first.delivered).toBe(0);
    expect(await alerts.countByStatus('PENDING')).toBe(1);

    const second = await service.dispatch(committed.events);
    expect(await alerts.countByStatus('PENDING')).toBe(1);
    expect(second.pending + second.skipped).toBeGreaterThan(0);
  });

  it('does not duplicate a sent delivery', async () => {
    const { hooks, hookId } = await seed();
    const watches = new InMemoryWatchlistRepository();
    const monitoring = new InMemoryMonitoringRepository();
    const alerts = new InMemoryAlertRepository();
    const sent: AlertMessage[] = [];
    const notifier = new TelegramNotifier('token', 'chat', async () => {
      sent.push({
        hookAddress: HOOK,
        chainId: 1,
        chainName: 'Ethereum',
        eventType: 'IMPLEMENTATION_CHANGED',
        title: 'x',
        description: 'y',
        severity: 'high',
        confidence: 'HIGH',
      });
      return new Response('{}', { status: 200 });
    });
    const service = new AlertService(alerts, watches, monitoring, hooks, notifier);
    await watches.upsert({ hookId, identifier: 'lp-1' });
    const committed = await monitoring.commit(
      buildMonitorSnapshot({
        hookId,
        blockNumber: 3n,
        implementationAddress: '0x5555555555555555555555555555555555555555',
        bytecodeHash: '0xbbbb',
        functions: [],
        permissions: [],
      }),
      [
        {
          type: SECURITY_EVENT_TYPES.IMPLEMENTATION_CHANGED,
          severity: 'high',
          confidence: 'HIGH',
          title: 'Implementation changed',
          description: 'EIP-1967 slot changed.',
          evidence: { from: '0x22', to: '0x55' },
        },
      ],
    );

    const first = await service.dispatch(committed.events);
    const second = await service.dispatch(committed.events);
    expect(first.delivered).toBe(1);
    expect(second.delivered).toBe(0);
    expect(await alerts.countByStatus('SENT')).toBe(1);
  });

  it('skips disabled event types', async () => {
    const { hooks, hookId } = await seed();
    const watches = new InMemoryWatchlistRepository();
    const monitoring = new InMemoryMonitoringRepository();
    const alerts = new InMemoryAlertRepository();
    const service = new AlertService(
      alerts,
      watches,
      monitoring,
      hooks,
      new TelegramNotifier('', ''),
    );
    await watches.upsert({
      hookId,
      identifier: 'lp-1',
      eventTypes: ['OWNERSHIP_CHANGED'],
    });
    const committed = await monitoring.commit(
      buildMonitorSnapshot({
        hookId,
        blockNumber: 4n,
        bytecodeHash: '0xcccc',
        functions: [],
        permissions: [],
      }),
      [
        {
          type: SECURITY_EVENT_TYPES.BYTECODE_CHANGED,
          severity: 'high',
          confidence: 'HIGH',
          title: 'Bytecode changed',
          description: 'hash changed',
          evidence: { from: 'a', to: 'b' },
        },
      ],
    );
    const result = await service.dispatch(committed.events);
    expect(result.skipped).toBeGreaterThan(0);
    expect(result.pending).toBe(0);
    expect(result.delivered).toBe(0);
  });
});
