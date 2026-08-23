import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { InMemoryContractRepository } from '../contracts/contract.repository.js';
import { InMemoryHookRepository } from '../hooks/hook.repository.js';
import { runHookAnalysis } from './analyzer.worker.js';
import { InMemoryFindingRepository } from './finding.repository.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const ADMIN = getAddress('0x3333333333333333333333333333333333333333');
const POOL = ('0x' + 'aa'.repeat(32)) as `0x${string}`;

describe('analyzer worker', () => {
  it('persists findings from contract intelligence and is repeatable', async () => {
    const hooks = new InMemoryHookRepository();
    const contracts = new InMemoryContractRepository();
    const findings = new InMemoryFindingRepository();

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

    await contracts.save({
      address: HOOK,
      chainId: 1,
      bytecode: '0xf1f4',
      sourceCode: null,
      compilerVersion: null,
      bytecodeHash: '0x00',
      sourceVerified: false,
      sourceUrl: null,
      abiJson: null,
      isProxy: true,
      implementationAddress: '0x2222222222222222222222222222222222222222',
      adminAddress: ADMIN,
      functions: [
        {
          name: 'afterSwap',
          selector: '0x11111111',
          visibility: 'external',
          stateMutability: 'nonpayable',
        },
        {
          name: 'setFee',
          selector: '0x22222222',
          visibility: 'external',
          stateMutability: 'nonpayable',
        },
      ],
      permissions: [{ type: 'owner', address: ADMIN, source: 'owner()' }],
    });

    const first = await runHookAnalysis({
      chainId: 1,
      hooks,
      contracts,
      findings,
      logger: { info() {}, warn() {}, error() {} },
    });
    const second = await runHookAnalysis({
      chainId: 1,
      hooks,
      contracts,
      findings,
      logger: { info() {}, warn() {}, error() {} },
    });

    const [hook] = await hooks.getByAddress(HOOK, 1);
    const rows = await findings.listByHookId(hook!.id);
    expect(first.analyzed).toBe(1);
    expect(second.analyzed).toBe(1);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map((row) => row.ruleId).sort()).toEqual(
      [...new Set(rows.map((row) => row.ruleId))].sort(),
    );
    expect(rows.every((row) => Object.keys(row.evidence).length > 0)).toBe(true);
    expect(rows.some((row) => row.ruleId === 'proxy-used')).toBe(true);
    expect(rows.some((row) => row.ruleId === 'ext-call')).toBe(true);
    expect(rows.some((row) => row.ruleId === 'hooks-lifecycle')).toBe(true);
    expect(rows.some((row) => row.ruleId === 'privileged-functions')).toBe(true);
  });
});
