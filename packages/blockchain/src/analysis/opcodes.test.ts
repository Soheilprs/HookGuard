import { describe, expect, it } from 'vitest';
import { scanOpcodes } from './opcodes.js';
import { runAnalysis } from './engine.js';
import type { AnalysisInput } from './types.js';
import { externalCallRules } from './rules/external-call.rules.js';
import { getAddress } from 'viem';

describe('external call opcode scan', () => {
  it('finds CALL/DELEGATECALL/STATICCALL as opcodes', () => {
    const bytecode = '0xf1f4fa';
    const hits = scanOpcodes(bytecode, [0xf1, 0xf4, 0xfa]);
    expect(hits.find((hit) => hit.name === 'CALL')?.pcs).toEqual([0]);
    expect(hits.find((hit) => hit.name === 'DELEGATECALL')?.pcs).toEqual([1]);
    expect(hits.find((hit) => hit.name === 'STATICCALL')?.pcs).toEqual([2]);
  });

  it('does not treat PUSH immediates as CALL', () => {
    const bytecode = '0x60f1';
    const hits = scanOpcodes(bytecode, [0xf1]);
    expect(hits[0]?.pcs).toEqual([]);
  });

  it('emits evidence-backed findings for each opcode', () => {
    const input: AnalysisInput = {
      hookAddress: getAddress('0x1111111111111111111111111111111111111111'),
      chainId: 1,
      bytecode: '0xf1f4fa',
      functions: [],
      permissions: [],
      proxy: {
        isProxy: false,
        kind: 'none',
        implementationAddress: null,
        adminAddress: null,
      },
      codeEmpty: {},
    };
    const findings = runAnalysis(input, externalCallRules);
    expect(findings.map((finding) => finding.ruleId).sort()).toEqual([
      'ext-call',
      'ext-delegatecall',
      'ext-staticcall',
    ]);
    expect(findings.find((finding) => finding.ruleId === 'ext-delegatecall')?.severity).toBe(
      'high',
    );
  });
});
