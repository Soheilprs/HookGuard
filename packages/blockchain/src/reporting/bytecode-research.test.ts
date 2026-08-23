import { describe, expect, it } from 'vitest';
import { buildBytecodeResearchReport } from './bytecode-research.js';
import { exportBytecodeResearchMarkdown } from './exporters/bytecode-markdown.js';

describe('bytecode research report', () => {
  it('compares opcode-level DELEGATECALL with callback-reachable findings', () => {
    const report = buildBytecodeResearchReport({
      generatedAt: '2026-08-23T00:00:00.000Z',
      networks: [{ id: 1, slug: 'ethereum', name: 'Ethereum' }],
      hooksIndexed: 2,
      hooks: [
        {
          id: 'h1',
          address: '0xaaa',
          chainId: 1,
          analyzed: true,
          opcodeDelegatecall: true,
          opcodeCall: true,
          findings: [
            {
              id: 'f1',
              detector: 'CALLBACK_REACHABLE_DELEGATECALL',
              hookAddress: '0xaaa',
              chainId: 1,
              network: 'Ethereum',
              callback: 'beforeSwap',
              opcode: 'DELEGATECALL',
              pc: 12,
              pathLength: 3,
              analysisType: 'BYTECODE_CFG',
              severity: 'medium',
              confidence: 'MEDIUM',
              evidence: { callback: 'beforeSwap', pc: 12 },
              whyItMatters: 'review',
            },
          ],
        },
        {
          id: 'h2',
          address: '0xbbb',
          chainId: 1,
          analyzed: true,
          opcodeDelegatecall: true,
          opcodeCall: false,
          findings: [],
        },
      ],
    });
    expect(report.metrics.opcodeDelegatecallHooks).toBe(2);
    expect(report.metrics.reachableDelegatecallHooks).toBe(1);
    const md = exportBytecodeResearchMarkdown(report);
    expect(md).toMatch(/DELEGATECALL opcode present/);
    expect(md).toMatch(/not confirmed exploits/);
    expect(exportBytecodeResearchMarkdown(report)).toBe(md);
  });
});
