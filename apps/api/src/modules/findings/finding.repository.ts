import { randomUUID } from 'node:crypto';
import { type PrismaClient, type Prisma } from '@prisma/client';

export interface FindingRecord {
  id: string;
  hookId: string;
  ruleId: string;
  title: string;
  category: string;
  severity: string;
  confidence: string;
  detectionSource: string;
  validationStatus: string;
  validatedAt: Date | null;
  validationNotes: string | null;
  description: string;
  evidence: Record<string, unknown>;
  createdAt: Date;
}

export interface SaveFindingInput {
  hookId: string;
  ruleId: string;
  title: string;
  category: string;
  severity: string;
  confidence: string;
  detectionSource: string;
  description: string;
  evidence: Record<string, unknown>;
}

export interface FindingReviewInput {
  hookId: string;
  ruleId: string;
  status: string;
  notes: string;
  validatedAt?: Date;
}

export interface FindingRepository {
  replaceForHook(
    hookId: string,
    engineRuleIds: string[],
    findings: SaveFindingInput[],
  ): Promise<FindingRecord[]>;
  listByHookId(hookId: string): Promise<FindingRecord[]>;
  applyReview(input: FindingReviewInput): Promise<void>;
  countAll(): Promise<number>;
}

export class InMemoryFindingRepository implements FindingRepository {
  readonly findings = new Map<string, FindingRecord>();

  private key(hookId: string, ruleId: string): string {
    return `${hookId}:${ruleId}`;
  }

  async replaceForHook(
    hookId: string,
    engineRuleIds: string[],
    findings: SaveFindingInput[],
  ): Promise<FindingRecord[]> {
    const keep = new Set(findings.map((item) => item.ruleId));
    for (const [key, row] of this.findings) {
      if (row.hookId === hookId && engineRuleIds.includes(row.ruleId) && !keep.has(row.ruleId)) {
        this.findings.delete(key);
      }
    }

    const saved: FindingRecord[] = [];
    for (const input of findings) {
      const mapKey = this.key(input.hookId, input.ruleId);
      const existing = this.findings.get(mapKey);
      const record: FindingRecord = {
        id: existing?.id ?? randomUUID(),
        hookId: input.hookId,
        ruleId: input.ruleId,
        title: input.title,
        category: input.category,
        severity: input.severity,
        confidence: input.confidence,
        detectionSource: input.detectionSource,
        validationStatus: existing?.validationStatus ?? 'UNREVIEWED',
        validatedAt: existing?.validatedAt ?? null,
        validationNotes: existing?.validationNotes ?? null,
        description: input.description,
        evidence: input.evidence,
        createdAt: existing?.createdAt ?? new Date(),
      };
      this.findings.set(mapKey, record);
      saved.push(record);
    }
    return saved;
  }

  async listByHookId(hookId: string): Promise<FindingRecord[]> {
    return [...this.findings.values()]
      .filter((row) => row.hookId === hookId)
      .sort((a, b) => a.ruleId.localeCompare(b.ruleId));
  }

  async applyReview(input: FindingReviewInput): Promise<void> {
    const row = this.findings.get(this.key(input.hookId, input.ruleId));
    if (!row) return;
    row.validationStatus = input.status;
    row.validationNotes = input.notes;
    row.validatedAt = input.validatedAt ?? new Date();
  }

  async countAll(): Promise<number> {
    return this.findings.size;
  }
}

export class PrismaFindingRepository implements FindingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async replaceForHook(
    hookId: string,
    engineRuleIds: string[],
    findings: SaveFindingInput[],
  ): Promise<FindingRecord[]> {
    return this.prisma.$transaction(async (tx) => {
      const keep = findings.map((item) => item.ruleId);
      await tx.finding.deleteMany({
        where: {
          hookId,
          ruleId: { in: engineRuleIds.filter((id) => !keep.includes(id)) },
        },
      });

      const saved: FindingRecord[] = [];
      for (const input of findings) {
        const row = await tx.finding.upsert({
          where: { hookId_ruleId: { hookId: input.hookId, ruleId: input.ruleId } },
          create: {
            hookId: input.hookId,
            ruleId: input.ruleId,
            title: input.title,
            category: input.category,
            severity: input.severity,
            confidence: input.confidence,
            detectionSource: input.detectionSource,
            validationStatus: 'UNREVIEWED',
            description: input.description,
            evidence: input.evidence as Prisma.InputJsonValue,
          },
          update: {
            title: input.title,
            category: input.category,
            severity: input.severity,
            confidence: input.confidence,
            detectionSource: input.detectionSource,
            description: input.description,
            evidence: input.evidence as Prisma.InputJsonValue,
          },
        });
        saved.push(toRecord(row));
      }
      return saved;
    });
  }

  async listByHookId(hookId: string): Promise<FindingRecord[]> {
    const rows = await this.prisma.finding.findMany({
      where: { hookId },
      orderBy: [{ severity: 'asc' }, { ruleId: 'asc' }],
    });
    return rows.map(toRecord);
  }

  async applyReview(input: FindingReviewInput): Promise<void> {
    await this.prisma.finding.updateMany({
      where: { hookId: input.hookId, ruleId: input.ruleId },
      data: {
        validationStatus: input.status,
        validationNotes: input.notes,
        validatedAt: input.validatedAt ?? new Date(),
      },
    });
  }

  async countAll(): Promise<number> {
    return this.prisma.finding.count();
  }
}

function toRecord(row: {
  id: string;
  hookId: string;
  ruleId: string;
  title: string;
  category: string;
  severity: string;
  confidence: string;
  detectionSource: string;
  validationStatus: string;
  validatedAt: Date | null;
  validationNotes: string | null;
  description: string;
  evidence: unknown;
  createdAt: Date;
}): FindingRecord {
  return {
    ...row,
    evidence:
      row.evidence && typeof row.evidence === 'object' && !Array.isArray(row.evidence)
        ? (row.evidence as Record<string, unknown>)
        : {},
  };
}
