import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { InMemoryContractRepository } from '../contracts/contract.repository.js';
import { InMemoryHookRepository } from '../hooks/hook.repository.js';
import { InMemoryMonitoringRepository } from './repository.js';
import { runHookMonitoring } from './worker.js';

const HOOK = getAddress('0x0010d0d5db05933fa0d9f7038d365e1541a41888');
const POOL = ('0x' + 'aa'.repeat(32)) as `0x${string}`;
const IMPL_A = '0x2222222222222222222222222222222222222222';
const IMPL_B = '0x5555555555555555555555555555555555555555';
const OWNER = '0x4444444444444444444444444444444444444444';

function contractInput(implementation: string, functions: Array<{ name: string; selector: string }>) {
  return {
    address: HOOK,
    chainId: 1,
    bytecode: '0x60806040',
    sourceCode: null,
    compilerVersion: null,
    bytecodeHash: implementation === IMPL_A ? '0xaaaa' : '0xbbbb',
    sourceVerified: false,
    sourceUrl: null,
    abiJson: null,
    isProxy: true,
    implementationAddress: implementation,
    adminAddress: '0x3333333333333333333333333333333333333333',
    functions: functions.map((fn) => ({
      ...fn,
      visibility: 'external',
      stateMutability: 'nonpayable',
    })),
    permissions: [{ type: 'owner', address: OWNER, source: 'owner()' }],
  };
}

describe('monitoring worker', () => {
  it('creates a baseline snapshot with no events, then detects an implementation change', async () => {
    const hooks = new InMemoryHookRepository();
    const contracts = new InMemoryContractRepository();
    const monitoring = new InMemoryMonitoringRepository();
    const silent = { info() {}, warn() {}, error() {} };

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

    await contracts.save(
      contractInput(IMPL_A, [{ name: 'afterSwap', selector: '0x11111111' }]),
    );

    const first = await runHookMonitoring({
      chainId: 1,
      hooks,
      contracts,
      monitoring,
      logger: silent,
    });
    expect(first.monitored).toBe(1);
    expect(first.events).toBe(0);

    const [hook] = await hooks.getByAddress(HOOK, 1);
    expect(await monitoring.snapshotCount(hook!.id)).toBe(1);
    expect(await monitoring.eventCount(hook!.id)).toBe(0);

    const second = await runHookMonitoring({
      chainId: 1,
      hooks,
      contracts,
      monitoring,
      logger: silent,
    });
    expect(second.events).toBe(0);
    expect(await monitoring.snapshotCount(hook!.id)).toBe(2);

    await contracts.save(
      contractInput(IMPL_B, [{ name: 'afterSwap', selector: '0x11111111' }]),
    );

    const third = await runHookMonitoring({
      chainId: 1,
      hooks,
      contracts,
      monitoring,
      logger: silent,
    });
    expect(third.events).toBeGreaterThan(0);
    const events = await monitoring.listEvents(hook!.id);
    expect(events.some((event) => event.type === 'IMPLEMENTATION_CHANGED')).toBe(true);
    expect(events.every((event) => Object.keys(event.evidence).length > 0)).toBe(true);

    const fourth = await runHookMonitoring({
      chainId: 1,
      hooks,
      contracts,
      monitoring,
      logger: silent,
    });
    expect(fourth.events).toBe(0);
    expect(await monitoring.eventCount(hook!.id)).toBe(events.length);
  });
});
