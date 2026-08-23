import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { runAnalysis } from '../engine.js';
import type { AnalysisInput } from '../types.js';
import { proxyRules } from './proxy.rules.js';

const HOOK = getAddress('0x1111111111111111111111111111111111111111');
const ADMIN = getAddress('0x3333333333333333333333333333333333333333');
const IMPL = getAddress('0x2222222222222222222222222222222222222222');

function input(overrides: Partial<AnalysisInput> = {}): AnalysisInput {
  return {
    hookAddress: HOOK,
    chainId: 1,
    bytecode: '0x60806040',
    functions: [],
    permissions: [],
    proxy: {
      isProxy: true,
      kind: 'transparent',
      implementationAddress: IMPL,
      adminAddress: ADMIN,
    },
    codeEmpty: {
      [HOOK.toLowerCase()]: false,
      [ADMIN.toLowerCase()]: true,
      [IMPL.toLowerCase()]: false,
    },
    ...overrides,
  };
}

describe('proxy rules', () => {
  it('emits proxy-used and proxy-admin with evidence', () => {
    const findings = runAnalysis(input(), proxyRules);
    const used = findings.find((finding) => finding.ruleId === 'proxy-used');
    const admin = findings.find((finding) => finding.ruleId === 'proxy-admin');
    expect(used?.evidence.implementationAddress).toBe(IMPL);
    expect(admin?.severity).toBe('medium');
    expect(admin?.evidence.adminAddress).toBe(ADMIN);
  });

  it('flags an EOA proxy admin', () => {
    const findings = runAnalysis(input(), proxyRules);
    const eoa = findings.find((finding) => finding.ruleId === 'proxy-admin-eoa');
    expect(eoa?.severity).toBe('high');
    expect(eoa?.evidence.bytecodeEmpty).toBe(true);
  });

  it('does not claim EOA admin without bytecode evidence', () => {
    const findings = runAnalysis(
      input({
        codeEmpty: { [HOOK.toLowerCase()]: false },
      }),
      proxyRules,
    );
    expect(findings.some((finding) => finding.ruleId === 'proxy-admin-eoa')).toBe(
      false,
    );
  });

  it('detects upgrade authority from upgradeTo', () => {
    const findings = runAnalysis(
      input({
        functions: [
          {
            name: 'upgradeTo',
            selector: '0x3659cfe6',
            visibility: 'external',
            stateMutability: 'nonpayable',
          },
        ],
      }),
      proxyRules,
    );
    expect(
      findings.some((finding) => finding.ruleId === 'proxy-upgrade-authority'),
    ).toBe(true);
  });
});
