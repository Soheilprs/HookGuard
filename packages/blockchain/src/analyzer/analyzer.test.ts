import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import { runAnalysis } from '../analysis/engine.js';
import type { AnalysisInput } from '../analysis/types.js';
import { ANALYZER_RULE_IDS, analyzerRules } from './engine.js';
import { parseSolidityFunctions } from './parser/solidity.js';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const UNSAFE = readFileSync(join(fixtures, 'UnsafeHook.sol'), 'utf8');
const SAFE = readFileSync(join(fixtures, 'SafeHook.sol'), 'utf8');

const ANALYZER_IDS = [
  'CALLBACK_REENTRANCY_RISK',
  'MISSING_ACCESS_CONTROL',
  'UNRESTRICTED_EXTERNAL_EXECUTION',
  'DANGEROUS_DELEGATECALL',
  'CUSTOM_ACCOUNTING_REVIEW',
  'HOOK_PERMISSION_MISMATCH',
] as const;

function lifecycleAddress(): `0x${string}` {
  const bits = (1n << 11n) | (1n << 10n) | (1n << 9n) | (1n << 8n) | (1n << 7n) | (1n << 6n);
  const value = (0x1111111111111111111111111111111111110000n | bits) as bigint;
  return getAddress(`0x${value.toString(16).padStart(40, '0')}`);
}

function mismatchAddress(): `0x${string}` {
  const value = (0x1111111111111111111111111111111111110000n | (1n << 4n)) as bigint;
  return getAddress(`0x${value.toString(16).padStart(40, '0')}`);
}

function input(source: string, hookAddress: `0x${string}`): AnalysisInput {
  return {
    hookAddress,
    chainId: 1,
    bytecode: '0x60806040',
    functions: [],
    permissions: [],
    sourceVerified: true,
    sourceCode: source,
    proxy: {
      isProxy: false,
      kind: 'none',
      implementationAddress: null,
      adminAddress: null,
    },
    codeEmpty: {},
  };
}

describe('hook security analyzer', () => {
  it('parses synthetic hook functions with locations', () => {
    const fns = parseSolidityFunctions(UNSAFE);
    expect(fns.map((fn) => fn.name)).toEqual(
      expect.arrayContaining(['beforeSwap', 'afterSwap', 'setFee', 'withdraw']),
    );
    const beforeSwap = fns.find((fn) => fn.name === 'beforeSwap');
    expect(beforeSwap?.sourceLocation).toMatch(/^L\d+-L\d+$/);
    expect(beforeSwap?.snippet).toMatch(/function beforeSwap/);
  });

  it('detects the six hook-specific patterns on UnsafeHook', () => {
    const findings = runAnalysis(input(UNSAFE, mismatchAddress()), analyzerRules);
    const ids = findings.map((item) => item.ruleId);
    for (const id of ANALYZER_IDS) {
      expect(ids).toContain(id);
    }
    expect(ANALYZER_RULE_IDS).toEqual(expect.arrayContaining([...ANALYZER_IDS]));
    for (const finding of findings) {
      expect(Object.keys(finding.evidence).length).toBeGreaterThan(0);
      expect(finding.functionName).toBeTruthy();
      expect(finding.description).toMatch(/not a proof of exploitability/i);
      expect(finding.description).not.toMatch(/confirmed exploit/i);
      expect(finding.description).not.toMatch(/is malicious/i);
    }
    const reentrancy = findings.find((item) => item.ruleId === 'CALLBACK_REENTRANCY_RISK');
    expect(reentrancy?.functionName).toBe('beforeSwap');
    expect(reentrancy?.codeSnippet).toMatch(/sender\.call/);
    expect(reentrancy?.analysisType).toBe('SOURCE');
    expect(reentrancy?.evidence.callBeforeLaterWrite).toBe(true);

    const access = findings.find((item) => item.ruleId === 'MISSING_ACCESS_CONTROL');
    expect(access?.codeSnippet).toMatch(/setFee|setOracle|withdraw|pause|upgradeTo/);

    const unrestricted = findings.find(
      (item) => item.ruleId === 'UNRESTRICTED_EXTERNAL_EXECUTION',
    );
    expect(unrestricted?.evidence.targets).toEqual(
      expect.arrayContaining([expect.objectContaining({ target: 'sender', unrestricted: true })]),
    );

    const delegate = findings.find((item) => item.ruleId === 'DANGEROUS_DELEGATECALL');
    expect(delegate?.functionName).toBe('afterSwap');
    expect(delegate?.confidence).toBe('HIGH');

    const accounting = findings.find((item) => item.ruleId === 'CUSTOM_ACCOUNTING_REVIEW');
    expect(accounting?.evidence.hookDataDecode).toBe(true);

    const mismatch = findings.find((item) => item.ruleId === 'HOOK_PERMISSION_MISMATCH');
    expect(mismatch?.evidence.extraImplemented).toEqual(
      expect.arrayContaining(['beforeSwap', 'afterSwap']),
    );
  });

  it('does not flag SafeHook CEI, guarded setters, constant call target, or zero delta', () => {
    const findings = runAnalysis(input(SAFE, lifecycleAddress()), analyzerRules);
    const ids = findings.map((item) => item.ruleId);
    expect(ids).not.toContain('CALLBACK_REENTRANCY_RISK');
    expect(ids).not.toContain('MISSING_ACCESS_CONTROL');
    expect(ids).not.toContain('UNRESTRICTED_EXTERNAL_EXECUTION');
    expect(ids).not.toContain('DANGEROUS_DELEGATECALL');
    expect(ids).not.toContain('CUSTOM_ACCOUNTING_REVIEW');
    expect(ids).not.toContain('HOOK_PERMISSION_MISMATCH');
  });

  it('does not treat withdraw as a hook-callback reentrancy finding', () => {
    const findings = runAnalysis(input(UNSAFE, lifecycleAddress()), analyzerRules);
    const reentrancy = findings.find((item) => item.ruleId === 'CALLBACK_REENTRANCY_RISK');
    expect(reentrancy?.functionName).not.toBe('withdraw');
    const callbacks = reentrancy?.evidence.callbacks as string[] | undefined;
    expect(callbacks).not.toContain('withdraw');
  });

  it('falls back to bytecode for delegatecall when source is missing', () => {
    const findings = runAnalysis(
      {
        ...input('', lifecycleAddress()),
        sourceCode: null,
        sourceVerified: false,
        bytecode: '0xf4',
        functions: [
          {
            name: 'beforeSwap',
            selector: '0x11111111',
            visibility: 'external',
            stateMutability: 'nonpayable',
          },
        ],
      },
      analyzerRules,
    );
    const delegate = findings.find((item) => item.ruleId === 'DANGEROUS_DELEGATECALL');
    expect(delegate?.analysisType).toBe('BYTECODE');
    expect(delegate?.confidence).toBe('LOW');
    expect(delegate?.evidence.reachableFromHookCallback).toBe(false);
    expect(delegate?.codeSnippet).toBeNull();
    expect(findings.some((item) => item.ruleId === 'CALLBACK_REENTRANCY_RISK')).toBe(false);
    expect(findings.some((item) => item.ruleId === 'MISSING_ACCESS_CONTROL')).toBe(false);
  });
});
