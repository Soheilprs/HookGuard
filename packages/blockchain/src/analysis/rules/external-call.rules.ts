import type { AnalysisInput, AnalysisRule, EngineFinding } from '../types.js';
import { scanOpcodes } from '../opcodes.js';

const CALL = 0xf1;
const DELEGATECALL = 0xf4;
const STATICCALL = 0xfa;

function hitsFor(input: AnalysisInput, opcode: number) {
  return scanOpcodes(input.bytecode, [opcode])[0];
}

export const externalCallRule: AnalysisRule = {
  id: 'ext-call',
  run(input: AnalysisInput): EngineFinding[] {
    const hit = hitsFor(input, CALL);
    if (!hit || hit.pcs.length === 0) return [];
    return [
      {
        ruleId: this.id,
        title: 'CALL opcode present in hook bytecode',
        category: 'external-calls',
        severity: 'medium',
        description:
          'The runtime bytecode contains CALL. The hook can make generic external calls during execution. This is an opcode observation, not a confirmed exploit.',
        evidence: {
          opcode: 'CALL',
          opcodeHex: '0xf1',
          count: hit.pcs.length,
          programCounters: hit.pcs.slice(0, 16),
        },
      },
    ];
  },
};

export const externalDelegatecallRule: AnalysisRule = {
  id: 'ext-delegatecall',
  run(input: AnalysisInput): EngineFinding[] {
    const hit = hitsFor(input, DELEGATECALL);
    if (!hit || hit.pcs.length === 0) return [];
    return [
      {
        ruleId: this.id,
        title: 'DELEGATECALL opcode present in hook bytecode',
        category: 'external-calls',
        severity: 'high',
        description:
          'The runtime bytecode contains DELEGATECALL, which runs another contract in the hook’s storage context. This is an opcode observation, not a confirmed exploit.',
        evidence: {
          opcode: 'DELEGATECALL',
          opcodeHex: '0xf4',
          count: hit.pcs.length,
          programCounters: hit.pcs.slice(0, 16),
        },
      },
    ];
  },
};

export const externalStaticcallRule: AnalysisRule = {
  id: 'ext-staticcall',
  run(input: AnalysisInput): EngineFinding[] {
    const hit = hitsFor(input, STATICCALL);
    if (!hit || hit.pcs.length === 0) return [];
    return [
      {
        ruleId: this.id,
        title: 'STATICCALL opcode present in hook bytecode',
        category: 'external-calls',
        severity: 'low',
        description:
          'The runtime bytecode contains STATICCALL (read-only external calls). This is an opcode observation.',
        evidence: {
          opcode: 'STATICCALL',
          opcodeHex: '0xfa',
          count: hit.pcs.length,
          programCounters: hit.pcs.slice(0, 16),
        },
      },
    ];
  },
};

export const externalCallRules: AnalysisRule[] = [
  externalCallRule,
  externalDelegatecallRule,
  externalStaticcallRule,
];
