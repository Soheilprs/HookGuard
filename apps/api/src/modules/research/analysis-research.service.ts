import {
  ANALYSIS_RESEARCH_DETECTORS,
  assertAnalysisResearchEvidence,
  buildAnalysisResearchReport,
  getChainById,
  listSupportedChains,
  type AnalysisResearchCorpus,
  type AnalysisResearchFindingInput,
  type AnalysisResearchReport,
} from '@hookguard/blockchain';
import { prisma } from '../../lib/prisma.js';

export async function loadAnalysisResearchCorpus(
  generatedAt = new Date().toISOString(),
): Promise<AnalysisResearchCorpus> {
  const [hooks, contracts, verified] = await Promise.all([
    prisma.hook.findMany({
      include: {
        findings: {
          where: { ruleId: { in: [...ANALYSIS_RESEARCH_DETECTORS] } },
        },
      },
      orderBy: [{ chainId: 'asc' }, { address: 'asc' }],
    }),
    prisma.contract.findMany({
      select: { address: true, chainId: true, sourceVerified: true },
    }),
    prisma.contract.count({ where: { sourceVerified: true } }),
  ]);

  const sourceByKey = new Map(
    contracts.map((row) => [
      `${row.chainId}:${row.address.toLowerCase()}`,
      row.sourceVerified,
    ]),
  );

  const reportHooks = hooks.map((hook) => {
    const network = getChainById(hook.chainId)?.name ?? `Chain ${hook.chainId}`;
    const findings: AnalysisResearchFindingInput[] = hook.findings
      .slice()
      .sort((a, b) => a.ruleId.localeCompare(b.ruleId))
      .map((row) => ({
        id: row.id,
        hookAddress: hook.address.toLowerCase(),
        chainId: hook.chainId,
        network,
        ruleId: row.ruleId,
        title: row.title,
        description: row.description,
        severity: row.severity,
        confidence: row.confidence,
        impact: row.impact,
        functionName: row.functionName,
        sourceLocation: row.sourceLocation,
        codeSnippet: row.codeSnippet,
        analysisType: row.analysisType,
        evidence: asEvidence(row.evidence),
      }));
    return {
      id: hook.id,
      address: hook.address.toLowerCase(),
      chainId: hook.chainId,
      sourceVerified: sourceByKey.get(`${hook.chainId}:${hook.address.toLowerCase()}`) ?? false,
      analyzed: true,
      findings,
    };
  });

  const chainIds = [...new Set(reportHooks.map((hook) => hook.chainId))].sort((a, b) => a - b);
  const networks = chainIds.map((id) => {
    const chain = getChainById(id);
    return {
      id,
      slug: chain?.slug ?? String(id),
      name: chain?.name ?? `Chain ${id}`,
    };
  });

  return {
    generatedAt,
    networks:
      networks.length > 0
        ? networks
        : listSupportedChains().map((chain) => ({
            id: chain.id,
            slug: chain.slug,
            name: chain.name,
          })),
    hooksIndexed: hooks.length,
    hooksWithVerifiedSource: verified,
    hooks: reportHooks,
  };
}

export async function generateAnalysisResearchReport(
  generatedAt?: string,
): Promise<AnalysisResearchReport> {
  const corpus = await loadAnalysisResearchCorpus(generatedAt);
  const report = buildAnalysisResearchReport(corpus);
  assertAnalysisResearchEvidence(report);
  return report;
}

function asEvidence(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
