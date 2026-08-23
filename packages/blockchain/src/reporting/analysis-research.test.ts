import { describe, expect, it } from 'vitest';
import {
  assertAnalysisResearchEvidence,
  buildAnalysisResearchReport,
  type AnalysisResearchCorpus,
} from './analysis-research.js';
import { exportAnalysisResearchJson } from './exporters/analysis-json.js';
import { exportAnalysisResearchMarkdown } from './exporters/analysis-markdown.js';
import { evidenceFileName, exportEvidenceMarkdown } from './exporters/evidence-markdown.js';

function corpus(): AnalysisResearchCorpus {
  return {
    generatedAt: '2026-08-23T00:00:00.000Z',
    networks: [
      { id: 1, slug: 'ethereum', name: 'Ethereum' },
      { id: 130, slug: 'unichain', name: 'Unichain' },
    ],
    hooksIndexed: 3,
    hooksWithVerifiedSource: 1,
    hooks: [
      {
        id: 'h1',
        address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00c0',
        chainId: 1,
        sourceVerified: true,
        analyzed: true,
        findings: [
          {
            id: 'find-access',
            hookAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00c0',
            chainId: 1,
            network: 'Ethereum',
            ruleId: 'MISSING_ACCESS_CONTROL',
            title: 'Sensitive hook function has no observed access-control check',
            description: 'capability',
            severity: 'high',
            confidence: 'HIGH',
            impact: 'UNGUARDED_SENSITIVE_FUNCTION',
            functionName: 'setFee',
            sourceLocation: 'L40-L42',
            codeSnippet: 'function setFee(uint256 fee) external {\n    currentFee = fee;\n}',
            analysisType: 'SOURCE',
            evidence: { functions: [{ name: 'setFee' }] },
          },
        ],
      },
      {
        id: 'h2',
        address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00c0',
        chainId: 1,
        sourceVerified: false,
        analyzed: true,
        findings: [
          {
            id: 'find-delegate',
            hookAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb00c0',
            chainId: 1,
            network: 'Ethereum',
            ruleId: 'DANGEROUS_DELEGATECALL',
            title: 'DELEGATECALL opcode present on a hook with lifecycle callbacks',
            description: 'bytecode',
            severity: 'low',
            confidence: 'LOW',
            impact: 'DELEGATECALL_IN_CALLBACK',
            functionName: 'beforeSwap',
            sourceLocation: null,
            codeSnippet: null,
            analysisType: 'BYTECODE',
            evidence: { opcode: 'DELEGATECALL', reachableFromHookCallback: false },
          },
        ],
      },
      {
        id: 'h3',
        address: '0xcccccccccccccccccccccccccccccccccccc00c0',
        chainId: 130,
        sourceVerified: false,
        analyzed: true,
        findings: [],
      },
    ],
  };
}

describe('analysis research report', () => {
  it('counts unique hooks per detector and source vs bytecode coverage', () => {
    const report = buildAnalysisResearchReport(corpus());
    expect(report.metrics.coverage.hooksIndexed).toBe(3);
    expect(report.metrics.coverage.hooksWithVerifiedSource).toBe(1);
    expect(report.metrics.coverage.hooksAnalyzed).toBe(3);
    expect(report.metrics.coverage.sourceAnalysisCount).toBe(1);
    expect(report.metrics.coverage.bytecodeAnalysisCount).toBe(2);
    expect(report.metrics.coverage.analyzerFindings).toBe(2);
    expect(report.metrics.detectors.MISSING_ACCESS_CONTROL.hooksAffected).toBe(1);
    expect(report.metrics.detectors.DANGEROUS_DELEGATECALL.findings).toBe(1);
    expect(report.metrics.detectors.DANGEROUS_DELEGATECALL.confidence.LOW).toBe(1);
    expect(report.metrics.detectors.CALLBACK_REENTRANCY_RISK.findings).toBe(0);
  });

  it('requires evidence and exports deterministic markdown/json plus evidence files', () => {
    const report = buildAnalysisResearchReport(corpus());
    assertAnalysisResearchEvidence(report);
    const json = exportAnalysisResearchJson(report);
    const md = exportAnalysisResearchMarkdown(report);
    expect(exportAnalysisResearchJson(report)).toBe(json);
    expect(exportAnalysisResearchMarkdown(report)).toBe(md);
    expect(md).toMatch(/Total hooks indexed/);
    expect(md).toMatch(/MISSING_ACCESS_CONTROL/);
    expect(md).toMatch(/not confirmed exploits/);
    expect(md).toMatch(/not proof that user funds are at risk/i);
    expect(md).not.toMatch(/user funds are stolen/i);

    const access = report.findings.find((item) => item.detector === 'MISSING_ACCESS_CONTROL');
    expect(access).toBeTruthy();
    const evidence = exportEvidenceMarkdown(access!);
    expect(evidenceFileName(access!)).toBe('find-access.md');
    expect(evidence).toMatch(/Detector/);
    expect(evidence).toMatch(/MISSING_ACCESS_CONTROL/);
    expect(evidence).toMatch(/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00c0/);
    expect(evidence).toMatch(/function setFee/);
    expect(evidence).toMatch(/Why it matters/);
    expect(evidence).toMatch(/Recommended review action/);
    expect(evidence).toMatch(/security-relevant implementation pattern requiring review/);
    expect(evidence).toMatch(/not a confirmed exploit/i);
    expect(evidence).not.toMatch(/is malicious/i);
    expect(Object.keys(access!.evidence).length).toBeGreaterThan(0);
  });

  it('does not invent analyzer findings when the corpus has none', () => {
    const report = buildAnalysisResearchReport({
      generatedAt: '2026-08-23T00:00:00.000Z',
      networks: [{ id: 1, slug: 'ethereum', name: 'Ethereum' }],
      hooksIndexed: 1,
      hooksWithVerifiedSource: 0,
      hooks: [
        {
          id: 'h1',
          address: '0x1111111111111111111111111111111111111111',
          chainId: 1,
          sourceVerified: false,
          analyzed: true,
          findings: [],
        },
      ],
    });
    expect(report.findings).toEqual([]);
    expect(report.metrics.detectors.HOOK_PERMISSION_MISMATCH.findings).toBe(0);
    expect(exportAnalysisResearchMarkdown(report)).toMatch(/Analyzer findings \| 0/);
  });
});
