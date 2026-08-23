import { describe, expect, it } from 'vitest';
import { computeLandscapeMetrics, selectCaseStudies } from './aggregators.js';
import { exportLandscapeJson } from './exporters/json.js';
import { exportLandscapeMarkdown } from './exporters/markdown.js';
import type { ReportCorpus, ReportFinding, ReportHook } from './metrics.js';
import { assertReportEvidence, buildLandscapeReport } from './risk-report.js';

const SWAP_HOOK = '0x11111111111111111111111111111111111100c0';

function finding(overrides: Partial<ReportFinding> = {}): ReportFinding {
  return {
    hookId: 'h1',
    hookAddress: SWAP_HOOK,
    chainId: 1,
    ruleId: 'risk-upgradeable-swap-control',
    category: 'UPGRADE_SECURITY',
    severity: 'high',
    confidence: 'HIGH',
    validationStatus: 'UNREVIEWED',
    impact: 'SWAP_PATH_LOGIC_REPLACEABLE',
    affectedComponent: 'hook-proxy',
    title: 'Swap-path hook logic is upgradeable',
    description: 'capability',
    evidence: { proxy: true, swapCallbacks: ['afterSwap'] },
    ...overrides,
  };
}

function corpus(hooks: ReportHook[]): ReportCorpus {
  return {
    generatedAt: '2026-08-23T00:00:00.000Z',
    networks: [
      { id: 1, slug: 'ethereum', name: 'Ethereum' },
      { id: 130, slug: 'unichain', name: 'Unichain' },
    ],
    hooks,
    poolsIndexed: 12,
    monitoredHooks: 2,
    securityEvents: 1,
  };
}

describe('landscape metrics', () => {
  it('counts unique hooks per risk category and coverage totals', () => {
    const data = corpus([
      {
        id: 'h1',
        address: SWAP_HOOK,
        chainId: 1,
        isProxy: true,
        findings: [
          finding(),
          finding({
            ruleId: 'risk-privileged-fee-modification',
            category: 'SWAP_SECURITY',
            impact: 'PRIVILEGED_FEE_CHANGE',
            evidence: { swapCallbacks: ['afterSwap'] },
          }),
        ],
      },
      {
        id: 'h2',
        address: '0x1000000000000000000000000000000000000000',
        chainId: 130,
        isProxy: false,
        findings: [
          finding({
            hookId: 'h2',
            hookAddress: '0x1000000000000000000000000000000000000000',
            chainId: 130,
            ruleId: 'ext-call',
            category: 'external-calls',
            severity: 'low',
            confidence: 'LOW',
            impact: null,
            affectedComponent: null,
            title: 'CALL opcode',
            evidence: { opcode: 'CALL' },
          }),
        ],
      },
    ]);

    const metrics = computeLandscapeMetrics(data);
    expect(metrics.coverage.hooksAnalyzed).toBe(2);
    expect(metrics.coverage.poolsIndexed).toBe(12);
    expect(metrics.coverage.findings).toBe(3);
    expect(metrics.coverage.monitoredHooks).toBe(2);
    expect(metrics.riskCategoryHooks.UPGRADE_SECURITY).toBe(1);
    expect(metrics.riskCategoryHooks.SWAP_SECURITY).toBe(1);
    expect(metrics.riskCategoryHooks.FUND_SAFETY).toBe(0);
    expect(metrics.severityFindings.high).toBe(2);
    expect(metrics.severityFindings.low).toBe(1);
    expect(metrics.confidenceFindings.STRONG).toBe(2);
    expect(metrics.confidenceFindings.OBSERVED).toBe(1);
    expect(metrics.capabilities.upgradeable).toBe(1);
    expect(metrics.capabilities.externalExecution).toBe(1);
    expect(metrics.capabilities.afterSwap).toBeGreaterThanOrEqual(1);
  });

  it('maps CONFIRMED validation to the CONFIRMED confidence band', () => {
    const data = corpus([
      {
        id: 'h1',
        address: SWAP_HOOK,
        chainId: 1,
        isProxy: false,
        findings: [finding({ validationStatus: 'CONFIRMED', confidence: 'LOW' })],
      },
    ]);
    expect(computeLandscapeMetrics(data).confidenceFindings.CONFIRMED).toBe(1);
    expect(computeLandscapeMetrics(data).confidenceFindings.OBSERVED).toBe(0);
  });
});

describe('exporters', () => {
  it('exports deterministic JSON and markdown with evidence', () => {
    const data = corpus([
      {
        id: 'h1',
        address: SWAP_HOOK,
        chainId: 1,
        isProxy: true,
        findings: [finding()],
      },
    ]);
    const report = buildLandscapeReport(data);
    assertReportEvidence(report);
    const json = exportLandscapeJson(report);
    const md = exportLandscapeMarkdown(report);
    expect(exportLandscapeJson(report)).toBe(json);
    expect(exportLandscapeMarkdown(report)).toBe(md);
    expect(JSON.parse(json).metrics.coverage.hooksAnalyzed).toBe(1);
    expect(md).toMatch(/UPGRADE_SECURITY/);
    expect(md).toMatch(/does not replace a professional smart-contract audit/i);
    expect(report.caseStudies[0]?.evidence.proxy).toBe(true);
  });

  it('does not invent case studies without findings', () => {
    const report = buildLandscapeReport(corpus([]));
    expect(report.caseStudies).toEqual([]);
    expect(exportLandscapeMarkdown(report)).toMatch(/No correlated risk-taxonomy findings/);
  });

  it('rejects case studies that have no evidence', () => {
    const report = buildLandscapeReport(
      corpus([
        {
          id: 'h1',
          address: SWAP_HOOK,
          chainId: 1,
          isProxy: true,
          findings: [finding()],
        },
      ]),
    );
    report.caseStudies[0]!.evidence = {};
    expect(() => assertReportEvidence(report)).toThrow(/missing evidence/);
  });
});

describe('case study selection', () => {
  it('picks the lexicographically first hook per category', () => {
    const data = corpus([
      {
        id: 'h-b',
        address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00c0',
        chainId: 1,
        isProxy: true,
        findings: [finding({ hookId: 'h-b', hookAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00c0' })],
      },
      {
        id: 'h-a',
        address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00c0',
        chainId: 1,
        isProxy: true,
        findings: [finding({ hookId: 'h-a', hookAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00c0' })],
      },
    ]);
    const studies = selectCaseStudies(data);
    expect(studies).toHaveLength(1);
    expect(studies[0]?.hookAddress).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00c0');
  });
});
