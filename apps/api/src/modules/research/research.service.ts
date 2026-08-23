import {
  assertReportEvidence,
  buildLandscapeReport,
  getChainById,
  listSupportedChains,
  type LandscapeReport,
  type ReportCorpus,
  type ReportFinding,
  type ReportHook,
} from '@hookguard/blockchain';
import { prisma } from '../../lib/prisma.js';

export async function loadReportCorpus(generatedAt = new Date().toISOString()): Promise<ReportCorpus> {
  const [hooks, contracts, poolsIndexed, monitoredGroups, securityEvents] = await Promise.all([
    prisma.hook.findMany({
      include: { findings: true },
      orderBy: [{ chainId: 'asc' }, { address: 'asc' }],
    }),
    prisma.contract.findMany({
      select: { address: true, chainId: true, isProxy: true },
    }),
    prisma.pool.count(),
    prisma.hookSnapshot.groupBy({ by: ['hookId'], _count: true }),
    prisma.securityEvent.count(),
  ]);

  const proxyByKey = new Map(
    contracts.map((row) => [`${row.chainId}:${row.address.toLowerCase()}`, row.isProxy]),
  );

  const reportHooks: ReportHook[] = hooks.map((hook) => {
    const findings: ReportFinding[] = hook.findings
      .slice()
      .sort((a, b) => a.ruleId.localeCompare(b.ruleId))
      .map((row) => ({
        hookId: hook.id,
        hookAddress: hook.address.toLowerCase(),
        chainId: hook.chainId,
        ruleId: row.ruleId,
        category: row.category,
        severity: row.severity,
        confidence: row.confidence,
        validationStatus: row.validationStatus,
        impact: row.impact,
        affectedComponent: row.affectedComponent,
        title: row.title,
        description: row.description,
        evidence: asEvidence(row.evidence),
      }));
    return {
      id: hook.id,
      address: hook.address.toLowerCase(),
      chainId: hook.chainId,
      isProxy: proxyByKey.get(`${hook.chainId}:${hook.address.toLowerCase()}`) ?? false,
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
    networks: networks.length > 0 ? networks : listSupportedChains().map((chain) => ({
      id: chain.id,
      slug: chain.slug,
      name: chain.name,
    })),
    hooks: reportHooks,
    poolsIndexed,
    monitoredHooks: monitoredGroups.length,
    securityEvents,
  };
}

export async function generateLandscapeReport(
  generatedAt?: string,
): Promise<LandscapeReport> {
  const corpus = await loadReportCorpus(generatedAt);
  const report = buildLandscapeReport(corpus);
  assertReportEvidence(report);
  return report;
}

function asEvidence(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
