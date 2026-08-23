import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeValidationMetrics,
  parseValidationDataset,
  type ValidationMetrics,
} from '@hookguard/blockchain';
import { prisma } from '../../lib/prisma.js';

export interface CorpusStats {
  hooksIndexed: number;
  poolsTracked: number;
  contractsInspected: number;
  verifiedSource: number;
  findings: number;
  averageRisk: null;
  hooksMonitored: number;
  securityEvents: number;
  lastMonitoringRun: string | null;
  byChain: Array<{ chainId: number; hooks: number; pools: number }>;
}

export async function getCorpusStats(): Promise<CorpusStats> {
  const [
    hooksIndexed,
    poolsTracked,
    contractsInspected,
    verifiedSource,
    findings,
    hookGroups,
    poolGroups,
    monitoredGroups,
    securityEvents,
    latestSnapshot,
  ] = await Promise.all([
    prisma.hook.count(),
    prisma.pool.count(),
    prisma.contract.count(),
    prisma.hook.count({ where: { verifiedSource: true } }),
    prisma.finding.count(),
    prisma.hook.groupBy({ by: ['chainId'], _count: true }),
    prisma.pool.groupBy({ by: ['chainId'], _count: true }),
    prisma.hookSnapshot.groupBy({ by: ['hookId'], _count: true }),
    prisma.securityEvent.count(),
    prisma.hookSnapshot.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  const poolsByChain = new Map(poolGroups.map((row) => [row.chainId, row._count]));
  const byChain = hookGroups.map((row) => ({
    chainId: row.chainId,
    hooks: row._count,
    pools: poolsByChain.get(row.chainId) ?? 0,
  }));

  return {
    hooksIndexed,
    poolsTracked,
    contractsInspected,
    verifiedSource,
    findings,
    averageRisk: null,
    hooksMonitored: monitoredGroups.length,
    securityEvents,
    lastMonitoringRun: latestSnapshot?.createdAt.toISOString() ?? null,
    byChain,
  };
}

export function getValidationSummary(): ValidationMetrics | null {
  const candidates = [
    join(process.cwd(), 'data/validation/dataset.json'),
    join(process.cwd(), '../../data/validation/dataset.json'),
    join(dirname(fileURLToPath(import.meta.url)), '../../../../../data/validation/dataset.json'),
  ];
  for (const path of candidates) {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
      return computeValidationMetrics(parseValidationDataset(raw));
    } catch {
      continue;
    }
  }
  return null;
}
