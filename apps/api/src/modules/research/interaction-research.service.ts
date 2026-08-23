import {
  INTERACTION_DETECTORS,
  annotateInteractionFinding,
  buildInteractionReport,
  getChainById,
  listSupportedChains,
  type InteractionCorpus,
  type InteractionReport,
} from '@hookguard/blockchain';
import { prisma } from '../../lib/prisma.js';

export async function loadInteractionCorpus(
  generatedAt = new Date().toISOString(),
): Promise<InteractionCorpus> {
  const [hooks, externalCallHooks] = await Promise.all([
    prisma.hook.findMany({
      include: {
        findings: { where: { ruleId: { in: [...INTERACTION_DETECTORS] } } },
      },
      orderBy: [{ chainId: 'asc' }, { address: 'asc' }],
    }),
    prisma.finding.groupBy({
      by: ['hookId'],
      where: { ruleId: 'CALLBACK_EXTERNAL_CALL' },
    }),
  ]);

  const reportHooks = hooks.map((hook) => {
    const network = getChainById(hook.chainId)?.name ?? `Chain ${hook.chainId}`;
    return {
      id: hook.id,
      address: hook.address.toLowerCase(),
      chainId: hook.chainId,
      analyzed: true,
      findings: hook.findings.map((row) =>
        annotateInteractionFinding({
          id: row.id,
          detector: row.ruleId,
          hookAddress: hook.address,
          chainId: hook.chainId,
          network,
          severity: row.severity,
          confidence: row.confidence,
          evidence: asEvidence(row.evidence),
        }),
      ),
    };
  });

  const chainIds = [...new Set(reportHooks.map((hook) => hook.chainId))].sort((a, b) => a - b);

  return {
    generatedAt,
    networks: (chainIds.length > 0
      ? chainIds
      : listSupportedChains().map((chain) => chain.id)
    ).map((id) => {
      const chain = getChainById(id);
      return { id, slug: chain?.slug ?? String(id), name: chain?.name ?? `Chain ${id}` };
    }),
    hooksIndexed: hooks.length,
    callbackExternalCallHooks: externalCallHooks.length,
    hooks: reportHooks,
  };
}

export async function generateInteractionReport(
  generatedAt?: string,
): Promise<InteractionReport> {
  return buildInteractionReport(await loadInteractionCorpus(generatedAt));
}

function asEvidence(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
