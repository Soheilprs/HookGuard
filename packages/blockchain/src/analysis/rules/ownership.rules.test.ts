import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { runAnalysis } from '../engine.js';
import type { AnalysisInput } from '../types.js';
import { ownershipRules } from './ownership.rules.js';

const HOOK = getAddress('0x1111111111111111111111111111111111111111');
const OWNER = getAddress('0x4444444444444444444444444444444444444444');

function input(overrides: Partial<AnalysisInput> = {}): AnalysisInput {
  return {
    hookAddress: HOOK,
    chainId: 1,
    bytecode: '0x60806040',
    functions: [
      {
        name: 'setFee',
        selector: '0x11111111',
        visibility: 'external',
        stateMutability: 'nonpayable',
      },
    ],
    permissions: [
      { type: 'owner', address: OWNER, source: 'owner()' },
      {
        type: 'default_admin_role',
        address: OWNER,
        source: 'AccessControl.getRoleMember(DEFAULT_ADMIN_ROLE)',
      },
    ],
    sourceVerified: true,
    sourceCode: null,
    proxy: {
      isProxy: false,
      kind: 'none',
      implementationAddress: null,
      adminAddress: null,
    },
    codeEmpty: {
      [HOOK.toLowerCase()]: false,
      [OWNER.toLowerCase()]: true,
    },
    ...overrides,
  };
}

describe('ownership rules', () => {
  it('records owner() and AccessControl facts', () => {
    const findings = runAnalysis(input(), ownershipRules);
    expect(findings.some((finding) => finding.ruleId === 'ownership-owner')).toBe(
      true,
    );
    expect(
      findings.some((finding) => finding.ruleId === 'ownership-access-control'),
    ).toBe(true);
  });

  it('flags EOA owner and DEFAULT_ADMIN_ROLE holder', () => {
    const findings = runAnalysis(input(), ownershipRules);
    const ownerEoa = findings.find((finding) => finding.ruleId === 'ownership-owner-eoa');
    expect(ownerEoa?.severity).toBe('medium');
    expect(ownerEoa?.evidence.correlated).toBe(true);
    expect(
      findings.some((finding) => finding.ruleId === 'ownership-default-admin-eoa'),
    ).toBe(true);
  });

  it('keeps uncorrelated EOA owner as an info fact', () => {
    const findings = runAnalysis(input({ functions: [] }), ownershipRules);
    const ownerEoa = findings.find((finding) => finding.ruleId === 'ownership-owner-eoa');
    expect(ownerEoa?.severity).toBe('info');
    expect(ownerEoa?.evidence.correlated).toBe(false);
  });
});
