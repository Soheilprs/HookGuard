import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { runAnalysis } from '../engine.js';
import { proxyRules } from '../rules/proxy.rules.js';
import type { AnalysisFunction, AnalysisInput } from '../types.js';
import { riskRules } from './risk-engine.js';
import { isRiskCategory } from './taxonomy.js';

const OWNER = getAddress('0x4444444444444444444444444444444444444444');
const ADMIN = getAddress('0x3333333333333333333333333333333333333333');
const IMPL = getAddress('0x2222222222222222222222222222222222222222');

function swapHook(): `0x${string}` {
  const value = (0x1111111111111111111111111111111111111111n | (1n << 6n)) as bigint;
  return getAddress(`0x${value.toString(16).padStart(40, '0')}`);
}

function plainHook(): `0x${string}` {
  return getAddress('0x1000000000000000000000000000000000000000');
}

function fn(
  name: string,
  selector: string,
): AnalysisFunction {
  return {
    name,
    selector,
    visibility: 'external',
    stateMutability: 'nonpayable',
  };
}

function input(overrides: Partial<AnalysisInput> = {}): AnalysisInput {
  return {
    hookAddress: swapHook(),
    chainId: 1,
    bytecode: '0x60806040',
    functions: [fn('afterSwap', '0xaaaabbbb')],
    permissions: [{ type: 'owner', address: OWNER, source: 'owner()' }],
    sourceVerified: false,
    sourceCode: null,
    proxy: {
      isProxy: true,
      kind: 'transparent',
      implementationAddress: IMPL,
      adminAddress: ADMIN,
    },
    codeEmpty: {
      [OWNER.toLowerCase()]: true,
      [ADMIN.toLowerCase()]: true,
      [IMPL.toLowerCase()]: false,
    },
    ...overrides,
  };
}

describe('risk classification', () => {
  it('classifies upgradeable swap-control when proxy, swap callback, and upgrade authority correlate', () => {
    const findings = runAnalysis(
      input({
        functions: [
          fn('afterSwap', '0xaaaabbbb'),
          fn('upgradeTo', '0x3659cfe6'),
        ],
      }),
      riskRules,
    );
    const risk = findings.find((item) => item.ruleId === 'risk-upgradeable-swap-control');
    expect(risk?.category).toBe('UPGRADE_SECURITY');
    expect(risk?.severity).toBe('critical');
    expect(risk?.impact).toBe('SWAP_PATH_LOGIC_REPLACEABLE');
    expect(risk?.affectedComponent).toBe('hook-proxy');
    expect(risk?.evidence.swapCallbacks).toEqual(expect.arrayContaining(['afterSwap']));
    expect(isRiskCategory(risk!.category)).toBe(true);
    expect(risk?.description).not.toMatch(/malicious/i);
    expect(risk?.description).not.toMatch(/this contract is vulnerable/i);
  });

  it('classifies privileged asset movement, fee, oracle, and admin control', () => {
    const findings = runAnalysis(
      input({
        functions: [
          fn('afterSwap', '0xaaaabbbb'),
          fn('transfer', '0xa9059cbb'),
          fn('setFee', '0x11111111'),
          fn('setOracle', '0x22222222'),
          fn('pause', '0x8456cb59'),
        ],
      }),
      riskRules,
    );
    expect(findings.some((item) => item.ruleId === 'risk-privileged-asset-movement')).toBe(
      true,
    );
    expect(findings.some((item) => item.ruleId === 'risk-privileged-fee-modification')).toBe(
      true,
    );
    expect(findings.some((item) => item.ruleId === 'risk-privileged-oracle-modification')).toBe(
      true,
    );
    expect(findings.some((item) => item.ruleId === 'risk-privileged-admin-control')).toBe(true);
    expect(findings.find((item) => item.ruleId === 'risk-privileged-asset-movement')?.category).toBe(
      'FUND_SAFETY',
    );
    expect(findings.find((item) => item.ruleId === 'risk-privileged-fee-modification')?.category).toBe(
      'SWAP_SECURITY',
    );
    expect(
      findings.find((item) => item.ruleId === 'risk-privileged-oracle-modification')?.category,
    ).toBe('ORACLE_SECURITY');
    expect(findings.find((item) => item.ruleId === 'risk-privileged-admin-control')?.category).toBe(
      'ADMIN_CONTROL',
    );
  });

  it('classifies external execution only when a callback and CALL/DELEGATECALL both exist', () => {
    const findings = runAnalysis(input({ bytecode: '0xf1' }), riskRules);
    const ext = findings.find((item) => item.ruleId === 'risk-callback-external-execution');
    expect(ext?.category).toBe('EXTERNAL_EXECUTION');
    expect(ext?.confidence).toBe('LOW');
    expect(ext?.description).not.toMatch(/swap path/i);
    expect(ext?.evidence.reachableFromHookCallback).toBe(false);
  });
});

describe('false positive prevention', () => {
  it('does not report upgradeable swap-control without a proxy', () => {
    const findings = runAnalysis(
      input({
        proxy: {
          isProxy: false,
          kind: 'none',
          implementationAddress: null,
          adminAddress: null,
        },
        functions: [fn('afterSwap', '0xaaaabbbb'), fn('upgradeTo', '0x3659cfe6')],
      }),
      riskRules,
    );
    expect(findings.some((item) => item.ruleId === 'risk-upgradeable-swap-control')).toBe(
      false,
    );
  });

  it('does not report fund safety without privileged control', () => {
    const findings = runAnalysis(
      input({
        permissions: [],
        functions: [fn('transfer', '0xa9059cbb')],
      }),
      riskRules,
    );
    expect(findings.some((item) => item.ruleId === 'risk-privileged-asset-movement')).toBe(
      false,
    );
  });

  it('does not report callback external execution from opcode alone', () => {
    const findings = runAnalysis(
      input({
        hookAddress: plainHook(),
        functions: [],
        bytecode: '0xf1f4',
        permissions: [],
        proxy: {
          isProxy: false,
          kind: 'none',
          implementationAddress: null,
          adminAddress: null,
        },
      }),
      riskRules,
    );
    expect(findings.some((item) => item.ruleId === 'risk-callback-external-execution')).toBe(
      false,
    );
  });
});

describe('evidence requirement', () => {
  it('attaches evidence to every risk finding', () => {
    const findings = runAnalysis(
      input({
        bytecode: '0xf1',
        functions: [
          fn('afterSwap', '0xaaaabbbb'),
          fn('upgradeTo', '0x3659cfe6'),
          fn('transfer', '0xa9059cbb'),
        ],
      }),
      riskRules,
    );
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((item) => Object.keys(item.evidence).length > 0)).toBe(true);
    expect(findings.every((item) => item.impact)).toBe(true);
    expect(findings.every((item) => item.affectedComponent)).toBe(true);
  });
});

describe('existing analysis compatibility', () => {
  it('still emits observation rules such as proxy-used', () => {
    const findings = runAnalysis(input(), [...proxyRules, ...riskRules]);
    expect(findings.some((item) => item.ruleId === 'proxy-used')).toBe(true);
    expect(findings.find((item) => item.ruleId === 'proxy-used')?.category).toBe(
      'upgradeability',
    );
  });
});
