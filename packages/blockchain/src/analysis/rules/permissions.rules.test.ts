import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { runAnalysis } from '../engine.js';
import type { AnalysisInput } from '../types.js';
import { permissionsRules } from './permissions.rules.js';

describe('privileged function rules', () => {
  it('detects setFee, pause, and upgradeTo', () => {
    const input: AnalysisInput = {
      hookAddress: getAddress('0x1111111111111111111111111111111111111111'),
      chainId: 1,
      bytecode: '0x',
      functions: [
        {
          name: 'setFee',
          selector: '0x11111111',
          visibility: 'external',
          stateMutability: 'nonpayable',
        },
        {
          name: 'pause',
          selector: '0x8456cb59',
          visibility: 'external',
          stateMutability: 'nonpayable',
        },
        {
          name: 'upgradeTo',
          selector: '0x3659cfe6',
          visibility: 'external',
          stateMutability: 'nonpayable',
        },
      ],
      permissions: [],
      proxy: {
        isProxy: false,
        kind: 'none',
        implementationAddress: null,
        adminAddress: null,
      },
      codeEmpty: {},
    };
    const findings = runAnalysis(input, permissionsRules);
    const finding = findings.find((item) => item.ruleId === 'privileged-functions');
    const names = (
      finding?.evidence.functions as Array<{ name: string }> | undefined
    )?.map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining(['setFee', 'pause', 'upgradeTo']));
    expect(finding?.severity).toBe('high');
  });
});
