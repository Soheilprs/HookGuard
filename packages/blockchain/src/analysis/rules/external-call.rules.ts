import type { DetectionSource, FindingConfidence } from '@hookguard/types';
import type { AnalysisInput, AnalysisRule, EngineFinding } from '../types.js';
import { scanOpcodes } from '../opcodes.js';
import { associateCallsWithSource } from '../source-calls.js';
import { ruleTier } from '../tiers.js';

const CALL = 0xf1;
const DELEGATECALL = 0xf4;
const STATICCALL = 0xfa;

function hitsFor(input: AnalysisInput, opcode: number) {
  return scanOpcodes(input.bytecode, [opcode])[0];
}

function sourceContext(input: AnalysisInput, kind: 'call' | 'delegatecall' | 'staticcall') {
  const hits = associateCallsWithSource(input.sourceCode).filter((hit) =>
    hit.kinds.includes(kind),
  );
  const lifecycle = hits.filter((hit) => hit.lifecycle).map((hit) => hit.functionName);
  const other = hits.filter((hit) => !hit.lifecycle).map((hit) => hit.functionName);
  return { lifecycle, other, hasSource: Boolean(input.sourceCode) };
}

function emission(
  input: AnalysisInput,
  ruleId: string,
  opcode: number,
  name: string,
  opcodeHex: string,
  bytecodeSeverity: 'low' | 'medium' | 'high',
): EngineFinding[] {
  const hit = hitsFor(input, opcode);
  const ctx = sourceContext(
    input,
    name.toLowerCase() as 'call' | 'delegatecall' | 'staticcall',
  );
  const fromBytecode = Boolean(hit && hit.pcs.length > 0);
  const fromSource = ctx.lifecycle.length > 0 || ctx.other.length > 0;
  if (!fromBytecode && !fromSource) return [];

  const inLifecycle = ctx.lifecycle.length > 0;
  let confidence: FindingConfidence = 'LOW';
  let detectionSource: DetectionSource = 'BYTECODE_OPCODE';
  if (inLifecycle) {
    confidence = 'MEDIUM';
    detectionSource = 'VERIFIED_SOURCE';
  } else if (fromSource) {
    confidence = 'LOW';
    detectionSource = 'VERIFIED_SOURCE';
  }

  const reachable = inLifecycle;
  const description = reachable
    ? `Verified source associates ${name} with hook lifecycle function(s) ${ctx.lifecycle.join(', ')}. Reachability is source-based, not a full CFG proof.`
    : `External ${name} opcode present in runtime bytecode. This does not prove the call is reachable from beforeSwap, afterSwap, or other hook callbacks.`;

  return [
    {
      ruleId,
      title: reachable
        ? `${name} associated with hook lifecycle in verified source`
        : `External ${name} opcode present in runtime bytecode`,
      category: 'external-calls',
      severity: reachable ? bytecodeSeverity : 'low',
      confidence,
      detectionSource,
      ruleTier: ruleTier(ruleId, 3),
      description,
      evidence: {
        opcode: name,
        opcodeHex,
        count: hit?.pcs.length ?? 0,
        programCounters: (hit?.pcs ?? []).slice(0, 16),
        reachableFromHookCallback: reachable,
        lifecycleFunctions: ctx.lifecycle,
        otherFunctions: ctx.other,
        sourceVerified: input.sourceVerified,
      },
    },
  ];
}

export const externalCallRule: AnalysisRule = {
  id: 'ext-call',
  run(input: AnalysisInput): EngineFinding[] {
    return emission(input, this.id, CALL, 'CALL', '0xf1', 'medium');
  },
};

export const externalDelegatecallRule: AnalysisRule = {
  id: 'ext-delegatecall',
  run(input: AnalysisInput): EngineFinding[] {
    return emission(input, this.id, DELEGATECALL, 'DELEGATECALL', '0xf4', 'high');
  },
};

export const externalStaticcallRule: AnalysisRule = {
  id: 'ext-staticcall',
  run(input: AnalysisInput): EngineFinding[] {
    return emission(input, this.id, STATICCALL, 'STATICCALL', '0xfa', 'low');
  },
};

export const externalCallRules: AnalysisRule[] = [
  externalCallRule,
  externalDelegatecallRule,
  externalStaticcallRule,
];
