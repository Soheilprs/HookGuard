import { describe, expect, it } from 'vitest';
import {
  buildInteractionReport,
  type InteractionCorpus,
} from './interaction-research.js';
import {
  exportInteractionMarkdown,
  renderExternalInteractionAnalysis,
  renderInteractionCaseStudies,
} from './exporters/interaction-docs.js';

function corpus(): InteractionCorpus {
  return {
    generatedAt: '2026-08-23T00:00:00.000Z',
    networks: [{ id: 1, slug: 'ethereum', name: 'Ethereum' }],
    hooksIndexed: 2,
    callbackExternalCallHooks: 1,
    hooks: [
      {
        id: 'h1',
        address: '0xaaa',
        chainId: 1,
        analyzed: true,
        findings: [
          {
            id: 'f1',
            detector: 'TOKEN_MOVEMENT_IN_CALLBACK',
            hookAddress: '0xaaa',
            chainId: 1,
            network: 'Ethereum',
            callback: 'beforeSwap',
            targetAddress: '0x2222222222222222222222222222222222222222',
            targetType: 'TOKEN_CONTRACT',
            selector: '0xa9059cbb',
            selectorName: 'transfer',
            protocolName: null,
            opcode: 'CALL',
            pc: 10,
            confidence: 'MEDIUM',
            severity: 'medium',
            evidence: { targetAddress: '0x2222222222222222222222222222222222222222' },
            whyItMatters: 'review',
            reviewActions: ['check'],
          },
        ],
      },
      {
        id: 'h2',
        address: '0xbbb',
        chainId: 1,
        analyzed: true,
        findings: [],
      },
    ],
  };
}

describe('interaction research docs', () => {
  it('builds metrics and auto-doc headings without fabricating exploits', () => {
    const report = buildInteractionReport(corpus());
    expect(report.metrics.erc20Interactions).toBe(1);
    expect(report.caseStudies).toHaveLength(1);
    const analysis = renderExternalInteractionAnalysis(report);
    expect(analysis).toMatch(/# Executive Summary/);
    expect(analysis).toMatch(/# Methodology/);
    expect(analysis).toMatch(/# Findings/);
    expect(analysis).toMatch(/# Limitations/);
    expect(analysis).toMatch(/880|1/);
    expect(analysis).not.toMatch(/user funds are stolen/i);
    const cases = renderInteractionCaseStudies(report);
    expect(cases).toMatch(/0xaaa/);
    expect(cases).toMatch(/Why it matters/);
    const md = exportInteractionMarkdown(report);
    expect(md).toMatch(/Callback external calls/);
    expect(exportInteractionMarkdown(report)).toBe(md);
  });
});
