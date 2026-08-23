import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { runAnalysis } from '../analysis/engine.js';
import { HOOK_CALLBACKS } from '../analysis/rules/hooks.rules.js';
import type { AnalysisInput } from '../analysis/types.js';
import { recoverFunctionCandidates } from './analysis/functions.js';
import { bytecodeAnalysisRules } from './engine.js';
import { assemble, label, op, push, pushLabel, type Asm } from './fixtures/assemble.js';
import { CALLBACK_SELECTORS } from './hooks/lifecycle-map.js';
import { analyzeHookBytecode, clearBytecodeAnalysisCache } from './program.js';
import { disassemble } from './disassembler/instructions.js';

const BEFORE_SWAP = CALLBACK_SELECTORS.find((item) => item.name === 'beforeSwap')!.selector;
const OTHER = '0xaaaaaaaa';

function flaggedBeforeSwap(): `0x${string}` {
  const spec = HOOK_CALLBACKS.find((item) => item.name === 'beforeSwap')!;
  const value = (0x1111111111111111111111111111111111110000n | (1n << BigInt(spec.flagBit))) as bigint;
  return getAddress(`0x${value.toString(16).padStart(40, '0')}`);
}

function input(bytecode: `0x${string}`): AnalysisInput {
  return {
    hookAddress: flaggedBeforeSwap(),
    chainId: 1,
    bytecode,
    functions: [],
    permissions: [],
    sourceVerified: false,
    sourceCode: null,
    proxy: {
      isProxy: false,
      kind: 'none',
      implementationAddress: null,
      adminAddress: null,
    },
    codeEmpty: {},
  };
}

function selectorValue(selector: string): bigint {
  return BigInt(selector);
}

function dispatcher(routes: Array<{ selector: string; dest: string }>, bodies: Asm[]): Asm[] {
  const head: Asm[] = [push(1, 0), op('CALLDATALOAD'), push(1, 0xe0), op('SHR')];
  for (const route of routes) {
    head.push(
      op('DUP1'),
      push(4, selectorValue(route.selector)),
      op('EQ'),
      pushLabel(2, route.dest),
      op('JUMPI'),
    );
  }
  head.push(op('STOP'));
  return [...head, ...bodies];
}

function sixPushesThen(name: string): Asm[] {
  return [op('PUSH0'), op('PUSH0'), op('PUSH0'), op('PUSH0'), op('PUSH0'), op('PUSH0'), op(name)];
}

function sevenPushesThen(name: string): Asm[] {
  return [op('PUSH0'), op('PUSH0'), op('PUSH0'), op('PUSH0'), op('PUSH0'), op('PUSH0'), op('PUSH0'), op(name)];
}

describe('bytecode disassembler', () => {
  it('handles PUSH1-PUSH32 immediates and tracks pc', () => {
    const bytecode = assemble([
      push(1, 0xff),
      push(2, 0xabc),
      push(32, 1n << 200n),
      op('STOP'),
    ]);
    const insns = disassemble(bytecode);
    expect(insns.map((item) => item.name)).toEqual(['PUSH1', 'PUSH2', 'PUSH32', 'STOP']);
    expect(insns[0]?.pc).toBe(0);
    expect(insns[1]?.pc).toBe(2);
    expect(insns[2]?.pc).toBe(5);
    expect(insns[0]?.pushValue).toBe(0xffn);
    expect(insns[2]?.pushData?.length).toBe(32);
  });
});

describe('bytecode CFG detectors', () => {
  it('detects DELEGATECALL reachable from beforeSwap and ignores an unreachable one', () => {
    clearBytecodeAnalysisCache();
    const unsafe = assemble(
      dispatcher(
        [
          { selector: BEFORE_SWAP, dest: 'swap' },
          { selector: OTHER, dest: 'other' },
        ],
        [
          label('other'),
          op('JUMPDEST'),
          op('STOP'),
          label('swap'),
          op('JUMPDEST'),
          ...sixPushesThen('DELEGATECALL'),
          op('STOP'),
        ],
      ),
    );
    const safe = assemble(
      dispatcher(
        [
          { selector: BEFORE_SWAP, dest: 'swap' },
          { selector: OTHER, dest: 'other' },
        ],
        [
          label('other'),
          op('JUMPDEST'),
          ...sixPushesThen('DELEGATECALL'),
          op('STOP'),
          label('swap'),
          op('JUMPDEST'),
          op('STOP'),
        ],
      ),
    );

    const unsafeFindings = runAnalysis(input(unsafe), bytecodeAnalysisRules);
    const safeFindings = runAnalysis(input(safe), bytecodeAnalysisRules);
    expect(unsafeFindings.some((item) => item.ruleId === 'CALLBACK_REACHABLE_DELEGATECALL')).toBe(
      true,
    );
    expect(safeFindings.some((item) => item.ruleId === 'CALLBACK_REACHABLE_DELEGATECALL')).toBe(
      false,
    );

    const finding = unsafeFindings.find((item) => item.ruleId === 'CALLBACK_REACHABLE_DELEGATECALL');
    expect(finding?.evidence.callback).toBe('beforeSwap');
    expect(finding?.evidence.analysisType).toBe('BYTECODE_CFG');
    expect(finding?.functionName).toBe('beforeSwap');
    expect(finding?.analysisType).toBe('BYTECODE_CFG');
    expect(typeof finding?.evidence.pc).toBe('number');
    expect(finding?.evidence.pathLength).toBeGreaterThan(0);
    expect(finding?.description).not.toMatch(/confirmed exploit/i);
    expect(finding?.description).toMatch(/not a confirmed issue/i);

    const program = analyzeHookBytecode(input(unsafe));
    expect(program.callbacks.some((item) => item.callback === 'beforeSwap')).toBe(true);
    const recovered = recoverFunctionCandidates(disassemble(unsafe));
    expect(recovered.map((item) => item.selector)).toContain(BEFORE_SWAP);
  });

  it('detects reachable CALL, SSTORE, and call-before-sstore on a callback path', () => {
    clearBytecodeAnalysisCache();
    const bytecode = assemble(
      dispatcher([{ selector: BEFORE_SWAP, dest: 'swap' }], [
        label('swap'),
        op('JUMPDEST'),
        ...sevenPushesThen('CALL'),
        push(1, 0),
        push(1, 1),
        op('SSTORE'),
        op('STOP'),
      ]),
    );
    const findings = runAnalysis(input(bytecode), bytecodeAnalysisRules);
    expect(findings.some((item) => item.ruleId === 'CALLBACK_EXTERNAL_CALL')).toBe(true);
    expect(findings.some((item) => item.ruleId === 'CALLBACK_STORAGE_MUTATION')).toBe(true);
    expect(
      findings.some((item) => item.ruleId === 'CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE'),
    ).toBe(true);
    const call = findings.find((item) => item.ruleId === 'CALLBACK_EXTERNAL_CALL');
    expect(call?.category).toBe('EXTERNAL_EXECUTION');
    const store = findings.find((item) => item.ruleId === 'CALLBACK_STORAGE_MUTATION');
    expect(store?.category).toBe('SWAP_SECURITY');
    expect(store?.description).toMatch(/not a vulnerability/i);
  });

  it('is deterministic for the same bytecode', () => {
    clearBytecodeAnalysisCache();
    const bytecode = assemble(
      dispatcher([{ selector: BEFORE_SWAP, dest: 'swap' }], [
        label('swap'),
        op('JUMPDEST'),
        ...sixPushesThen('DELEGATECALL'),
        op('STOP'),
      ]),
    );
    const a = runAnalysis(input(bytecode), bytecodeAnalysisRules);
    const b = runAnalysis(input(bytecode), bytecodeAnalysisRules);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});


