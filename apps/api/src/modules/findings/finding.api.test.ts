import { getAddress } from 'viem';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import { InMemoryContractRepository } from '../contracts/contract.repository.js';
import { ContractService } from '../contracts/contract.service.js';
import { InMemoryHookRepository } from '../hooks/hook.repository.js';
import { HookService } from '../hooks/hook.service.js';
import { InMemoryFindingRepository } from './finding.repository.js';
import { FindingService } from './finding.service.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const POOL =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;

const hooks = new InMemoryHookRepository();
const contracts = new InMemoryContractRepository();
const findings = new InMemoryFindingRepository();
const app = await buildApp({
  hookService: new HookService(hooks),
  contractService: new ContractService(contracts, hooks),
  findingService: new FindingService(findings, hooks),
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
  await findings.replaceForHook(
    created.hook.id,
    ['proxy-used', 'risk-upgradeable-swap-control'],
    [
      {
        hookId: created.hook.id,
        ruleId: 'proxy-used',
        title: 'Hook is deployed behind a proxy',
        category: 'upgradeability',
        severity: 'info',
        description: 'Storage-slot inspection shows a proxy.',
        evidence: { kind: 'transparent', implementationAddress: '0x2222' },
        confidence: 'HIGH',
        detectionSource: 'EIP1967_STORAGE',
      },
      {
        hookId: created.hook.id,
        ruleId: 'risk-upgradeable-swap-control',
        title: 'Swap-path hook logic is upgradeable',
        category: 'UPGRADE_SECURITY',
        severity: 'critical',
        description: 'A proxy, swap callback, and upgrade authority were observed together.',
        evidence: {
          proxy: true,
          proxyKind: 'eip-1967',
          swapCallbacks: ['beforeSwap'],
          eoaUpgradeController: true,
        },
        confidence: 'HIGH',
        detectionSource: 'EIP1967_STORAGE',
        impact: 'SWAP_PATH_LOGIC_REPLACEABLE',
        affectedComponent: 'hook-proxy',
      },
    ],
  );
});

afterAll(async () => {
  await app.close();
});

describe('GET /hooks/:address/findings', () => {
  it('returns evidence-based findings without a risk score', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/hooks/${HOOK}/findings`,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      deployments: Array<{
        findings: Array<{
          ruleId: string;
          title: string;
          severity: string;
          confidence: string;
          detectionSource: string;
          validationStatus: string;
          category: string;
          description: string;
          evidence: Record<string, unknown>;
          guidance: string;
          reviewQuestions: string[];
          impactExplanation: string | null;
        }>;
      }>;
    };
    const finding = body.deployments[0]?.findings.find((row) => row.ruleId === 'proxy-used');
    expect(finding?.ruleId).toBe('proxy-used');
    expect(finding?.title).toBe('Hook is deployed behind a proxy');
    expect(finding?.severity).toBe('info');
    expect(finding?.evidence.kind).toBe('transparent');
    expect(finding?.confidence).toBe('HIGH');
    expect(finding?.detectionSource).toBe('EIP1967_STORAGE');
    expect(finding?.validationStatus).toBe('UNREVIEWED');
    expect(finding?.guidance).toMatch(/does not replace a professional smart-contract audit/i);
    expect(finding?.reviewQuestions.length).toBeGreaterThan(0);
    expect(Object.keys(finding?.evidence ?? {}).length).toBeGreaterThan(0);

    const risk = body.deployments[0]?.findings.find(
      (row) => row.ruleId === 'risk-upgradeable-swap-control',
    );
    expect(risk?.guidance).toMatch(/proxy/i);
    expect(risk?.impactExplanation).toMatch(/replace swap-callback logic/i);
    expect(risk?.reviewQuestions.length).toBeGreaterThan(0);
    expect(risk?.evidence.proxy).toBe(true);

    expect(JSON.stringify(body)).not.toMatch(/riskScore/);
    expect(JSON.stringify(body)).not.toMatch(/validationNotes/);
    expect(JSON.stringify(body)).not.toMatch(/is malicious/i);
  });

  it('returns 404 for an unknown hook', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/hooks/0x0000000000000000000000000000000000000001/findings',
    });
    expect(response.statusCode).toBe(404);
  });
});
