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
    functions: [],
    permissions: [
      { type: 'owner', address: OWNER, source: 'owner()' },
      {
        type: 'default_admin_role',
        address: OWNER,
        source: 'AccessControl.getRoleMember(DEFAULT_ADMIN_ROLE)',
      },
    ],
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
    expect(
      findings.find((finding) => finding.ruleId === 'ownership-owner-eoa')?.severity,
    ).toBe('medium');
    expect(
      findings.some((finding) => finding.ruleId === 'ownership-default-admin-eoa'),
    ).toBe(true);
  });
});
