import {
  BYTECODE_CFG_DETECTORS,
  annotateBytecodeFinding,
  buildBytecodeResearchReport,
  getChainById,
  listSupportedChains,
  scanOpcodes,
  type BytecodeResearchCorpus,
  type BytecodeResearchReport,
} from '@hookguard/blockchain';
import { prisma } from '../../lib/prisma.js';

export async function loadBytecodeResearchCorpus(
  generatedAt = new Date().toISOString(),
): Promise<BytecodeResearchCorpus> {
  const [hooks, contracts] = await Promise.all([
    prisma.hook.findMany({
      include: {
        findings: { where: { ruleId: { in: [...BYTECODE_CFG_DETECTORS] } } },
      },
      orderBy: [{ chainId: 'asc' }, { address: 'asc' }],
    }),
    prisma.contract.findMany({
      select: { address: true, chainId: true, bytecode: true },
    }),
  ]);

  const codeByKey = new Map(
    contracts.map((row) => [`${row.chainId}:${row.address.toLowerCase()}`, row.bytecode]),
  );

  const reportHooks = hooks.map((hook) => {
    const network = getChainById(hook.chainId)?.name ?? `Chain ${hook.chainId}`;
    const bytecode = codeByKey.get(`${hook.chainId}:${hook.address.toLowerCase()}`) ?? '0x';
    const delegate = scanOpcodes(bytecode, [0xf4])[0];
    const call = scanOpcodes(bytecode, [0xf1])[0];
    return {
      id: hook.id,
      address: hook.address.toLowerCase(),
      chainId: hook.chainId,
      analyzed: true,
      opcodeDelegatecall: (delegate?.pcs.length ?? 0) > 0,
      opcodeCall: (call?.pcs.length ?? 0) > 0,
      findings: hook.findings.map((row) =>
        annotateBytecodeFinding({
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
    networks: (chainIds.length > 0 ? chainIds : listSupportedChains().map((chain) => chain.id)).map(
      (id) => {
        const chain = getChainById(id);
        return {
          id,
          slug: chain?.slug ?? String(id),
          name: chain?.name ?? `Chain ${id}`,
        };
      },
    ),
    hooksIndexed: hooks.length,
    hooks: reportHooks,
  };
}

export async function generateBytecodeResearchReport(
  generatedAt?: string,
): Promise<BytecodeResearchReport> {
  const corpus = await loadBytecodeResearchCorpus(generatedAt);
  return buildBytecodeResearchReport(corpus);
}

function asEvidence(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
