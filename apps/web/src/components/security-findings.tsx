import type { FindingItem } from '@hookguard/types';
import { EmptyState } from '@/components/empty-state';
import { SeverityBadge } from '@/components/severity-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SecurityFindings({ findings }: { findings: FindingItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Findings</CardTitle>
      </CardHeader>
      <CardContent className={findings.length === 0 ? 'p-0' : 'space-y-4'}>
        {findings.length === 0 ? (
          <EmptyState
            title="No findings yet"
            description="Run the analysis engine to produce evidence-based observations. HookGuard does not invent scores or unsubstantiated vulnerabilities."
          />
        ) : (
          findings.map((finding) => (
            <article
              key={finding.ruleId}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={finding.severity} />
                <span className="text-xs text-muted-foreground">{finding.category}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {finding.ruleId}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{finding.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{finding.description}</p>
              <Evidence evidence={finding.evidence} />
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function Evidence({ evidence }: { evidence: Record<string, unknown> }) {
  const entries = Object.entries(evidence);
  if (entries.length === 0) return null;

  return (
    <dl className="mt-3 space-y-1 rounded-lg bg-muted/40 p-3 font-mono text-xs">
      <div className="text-[11px] font-sans font-medium uppercase tracking-wide text-muted-foreground">
        Evidence
      </div>
      {entries.map(([key, value]) => (
        <div key={key} className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="break-all whitespace-pre-wrap">
            {formatEvidenceValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function formatEvidenceValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}
