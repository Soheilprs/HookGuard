import { getAddress } from 'viem';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildMonitorSnapshot, SECURITY_EVENT_TYPES } from '@hookguard/blockchain';
import { buildApp } from '../../app.js';
import { InMemoryContractRepository } from '../contracts/contract.repository.js';
import { ContractService } from '../contracts/contract.service.js';
import { InMemoryFindingRepository } from '../findings/finding.repository.js';
import { FindingService } from '../findings/finding.service.js';
import { InMemoryHookRepository } from '../hooks/hook.repository.js';
import { HookService } from '../hooks/hook.service.js';
import { InMemoryMonitoringRepository } from './repository.js';
import { MonitoringService } from './service.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const POOL =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;

const hooks = new InMemoryHookRepository();
const contracts = new InMemoryContractRepository();
const findings = new InMemoryFindingRepository();
const monitoring = new InMemoryMonitoringRepository();
const app = await buildApp({
  hookService: new HookService(hooks),
  contractService: new ContractService(contracts, hooks),
  findingService: new FindingService(findings, hooks),
  monitoringService: new MonitoringService(monitoring, hooks),
});

beforeAll(async () => {
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

  await monitoring.commit(
    buildMonitorSnapshot({
      hookId: created.hook.id,
      blockNumber: 10n,
      implementationAddress: '0x5555555555555555555555555555555555555555',
      adminAddress: '0x3333333333333333333333333333333333333333',
      bytecodeHash: '0xbbbb',
      functions: [],
      permissions: [],
    }),
    [
      {
        type: SECURITY_EVENT_TYPES.IMPLEMENTATION_CHANGED,
        severity: 'high',
        confidence: 'HIGH',
        title: 'EIP-1967 implementation address changed',
        description: 'Implementation slot changed.',
        evidence: {
          from: '0x2222222222222222222222222222222222222222',
          to: '0x5555555555555555555555555555555555555555',
          detectionSource: 'EIP1967_STORAGE',
        },
      },
    ],
  );
});

afterAll(async () => {
  await app.close();
});

describe('GET /hooks/:address/events', () => {
  it('returns security events with evidence and without a risk score', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/hooks/${HOOK}/events`,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      deployments: Array<{
        events: Array<{
          type: string;
          severity: string;
          confidence: string;
          title: string;
          evidence: Record<string, unknown>;
        }>;
      }>;
    };
    const event = body.deployments[0]?.events[0];
    expect(event?.type).toBe('IMPLEMENTATION_CHANGED');
    expect(event?.severity).toBe('high');
    expect(event?.confidence).toBe('HIGH');
    expect(event?.evidence.to).toBe('0x5555555555555555555555555555555555555555');
    expect(JSON.stringify(body)).not.toMatch(/riskScore/);
    expect(JSON.stringify(body)).not.toMatch(/fingerprint/);
  });
});

describe('GET /hooks/:address/monitoring', () => {
  it('returns monitoring status and the last snapshot', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/hooks/${HOOK}/monitoring`,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      deployments: Array<{
        monitoring: {
          snapshotCount: number;
          eventCount: number;
          lastMonitoredAt: string | null;
        };
        lastSnapshot: { bytecodeHash: string; blockNumber: string } | null;
      }>;
    };
    expect(body.deployments[0]?.monitoring.snapshotCount).toBe(1);
    expect(body.deployments[0]?.monitoring.eventCount).toBe(1);
    expect(body.deployments[0]?.lastSnapshot?.bytecodeHash).toBe('0xbbbb');
    expect(JSON.stringify(body)).not.toMatch(/riskScore/);
  });
});
