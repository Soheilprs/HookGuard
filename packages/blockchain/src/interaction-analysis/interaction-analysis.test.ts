import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { runAnalysis } from '../analysis/engine.js';
import { HOOK_CALLBACKS } from '../analysis/rules/hooks.rules.js';
import type { AnalysisInput } from '../analysis/types.js';
import { assemble, label, op, push, pushLabel, type Asm } from '../bytecode-analysis/fixtures/assemble.js';
import { CALLBACK_SELECTORS } from '../bytecode-analysis/hooks/lifecycle-map.js';
import { clearBytecodeAnalysisCache } from '../bytecode-analysis/program.js';
import { recoverCallbackInteractions } from './analysis/external-calls.js';
import { interactionAnalysisRules } from './engine.js';
import { ERC20_SELECTORS } from './selectors/erc20.js';

const BEFORE_SWAP = CALLBACK_SELECTORS.find((item) => item.name === 'beforeSwap')!.selector;
const TOKEN = 0x2222222222222222222222222222222222222222n;
const POOL_MANAGER = 0x000000000004444c5dc75cb358380d2e3de08a90n;
const TRANSFER = BigInt(ERC20_SELECTORS.find((item) => item.name === 'transfer')!.selector);

function flaggedBeforeSwap(): `0x${string}` {
  const spec = HOOK_CALLBACKS.find((item) => item.name === 'beforeSwap')!;
  const value = (0x1111111111111111111111111111111111110000n | (1n << BigInt(spec.flagBit))) as bigint;
  return getAddress(`0x${value.toString(16).padStart(40, '0')}`);
}

function input(bytecode: `0x${string}`, chainId = 1): AnalysisInput {
  return {
    hookAddress: flaggedBeforeSwap(),
    chainId,
    bytecode,
    functions: [],
    permissions: [],
    sourceVerified: false,
    sourceCode: null,
    proxy: { isProxy: false, kind: 'none', implementationAddress: null, adminAddress: null },
    codeEmpty: {},
  };
}

function dispatcher(body: Asm[]): Asm[] {
  return [
    push(1, 0),
    op('CALLDATALOAD'),
    push(1, 0xe0),
    op('SHR'),
    op('DUP1'),
    push(4, BigInt(BEFORE_SWAP)),
    op('EQ'),
    pushLabel(2, 'swap'),
    op('JUMPI'),
    op('STOP'),
    label('swap'),
    op('JUMPDEST'),
    ...body,
    op('STOP'),
  ];
}

function callStack(address: Asm): Asm[] {
  return [op('PUSH0'), op('PUSH0'), op('PUSH0'), op('PUSH0'), op('PUSH0'), address, op('PUSH0'), op('CALL')];
}

describe('hook interaction intelligence', () => {
  it('recovers a constant ERC-20 transfer target', () => {
    clearBytecodeAnalysisCache();
    const bytecode = assemble(
      dispatcher([
        push(4, TRANSFER),
        op('POP'),
        ...callStack(push(20, TOKEN)),
      ]),
    );
    const calls = recoverCallbackInteractions(input(bytecode));
    expect(calls[0]?.target.address).toBe(`0x${TOKEN.toString(16).padStart(40, '0')}`);
    expect(calls[0]?.target.source).toBe('CONSTANT');
    expect(calls[0]?.selector).toBe(ERC20_SELECTORS.find((item) => item.name === 'transfer')!.selector);
    expect(calls[0]?.classification).toBe('TOKEN_CONTRACT');
    const findings = runAnalysis(input(bytecode), interactionAnalysisRules);
    expect(findings.some((item) => item.ruleId === 'TOKEN_MOVEMENT_IN_CALLBACK')).toBe(true);
    const token = findings.find((item) => item.ruleId === 'TOKEN_MOVEMENT_IN_CALLBACK');
    expect(token?.evidence.targetAddress).toBe(`0x${TOKEN.toString(16).padStart(40, '0')}`);
    expect(token?.evidence.selectorName).toBe('transfer');
    expect(token?.category).toBe('SWAP_SECURITY');
    expect(token?.description).not.toMatch(/theft|stolen|confirmed exploit/i);
  });

  it('classifies a curated protocol address', () => {
    clearBytecodeAnalysisCache();
    const bytecode = assemble(dispatcher(callStack(push(20, POOL_MANAGER))));
    const findings = runAnalysis(input(bytecode), interactionAnalysisRules);
    const proto = findings.find((item) => item.ruleId === 'PROTOCOL_INTERACTION');
    expect(proto?.evidence.protocolName).toMatch(/PoolManager/);
    expect(proto?.evidence.targetType).toBe('KNOWN_PROTOCOL');
    expect(proto?.severity).toBe('info');
  });

  it('detects calldata-derived CALL targets', () => {
    clearBytecodeAnalysisCache();
    const bytecode = assemble(
      dispatcher([
        op('PUSH0'),
        op('PUSH0'),
        op('PUSH0'),
        op('PUSH0'),
        op('PUSH0'),
        op('PUSH0'),
        op('CALLDATALOAD'),
        op('PUSH0'),
        op('CALL'),
      ]),
    );
    const findings = runAnalysis(input(bytecode), interactionAnalysisRules);
    const user = findings.find((item) => item.ruleId === 'USER_CONTROLLED_EXTERNAL_EXECUTION');
    expect(user).toBeTruthy();
    expect(user?.evidence.targetOrigin).toBe('CALLDATA');
    expect(user?.description).toMatch(/not a vulnerability/i);
  });

  it('does not invent interactions on a CALL-free callback', () => {
    clearBytecodeAnalysisCache();
    const bytecode = assemble(dispatcher([op('PUSH0'), op('PUSH0'), op('SSTORE')]));
    const findings = runAnalysis(input(bytecode), interactionAnalysisRules);
    expect(findings.map((item) => item.ruleId)).toEqual([]);
  });
});
