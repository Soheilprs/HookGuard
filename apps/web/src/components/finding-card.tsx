import type { FindingItem } from '@hookguard/types';
import { CodeEvidence } from '@/components/code-evidence';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { EvidenceViewer } from '@/components/evidence-viewer';
import { ImpactExplanation } from '@/components/impact-explanation';
import { ReviewChecklist } from '@/components/review-checklist';
import { RiskGuidanceCard } from '@/components/risk-guidance-card';
import { SeverityBadge } from '@/components/severity-badge';
import { cn } from '@/lib/utils';

export function FindingCard({ finding }: { finding: FindingItem }) {
  const heuristic = finding.confidence === 'LOW' || finding.ruleTier >= 3;
  return (
    <article
      className={cn(
        'rounded-xl border p-4',
        heuristic
          ? 'border-dashed border-zinc-300 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/40'
          : 'border-border bg-card',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={finding.severity} />
        <ConfidenceBadge confidence={finding.confidence} />
        {heuristic ? (
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Bytecode heuristic
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground">{finding.category}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{finding.ruleId}</span>
      </div>
      <h3 className="mt-2 text-sm font-semibold leading-snug break-words">{finding.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{finding.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Evidence source: <span className="font-mono">{finding.detectionSource}</span>
        {finding.affectedComponent ? (
          <>
            {' · '}
            {finding.affectedComponent}
          </>
        ) : null}
      </p>
      <ImpactExplanation impact={finding.impact} explanation={finding.impactExplanation} />
      <EvidenceViewer evidence={evidenceWithoutCode(finding.evidence)} />
      <CodeEvidence
        functionName={finding.functionName}
        sourceLocation={finding.sourceLocation}
        codeSnippet={finding.codeSnippet}
        analysisType={finding.analysisType}
      />
      <RiskGuidanceCard guidance={finding.guidance} category={finding.category} />
      <ReviewChecklist questions={finding.reviewQuestions} />
    </article>
  );
}

const CODE_EVIDENCE_KEYS = new Set([
  'functionName',
  'sourceLocation',
  'codeSnippet',
  'analysisType',
]);

function evidenceWithoutCode(evidence: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(evidence).filter(([key]) => !CODE_EVIDENCE_KEYS.has(key)),
  );
}
