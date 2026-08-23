import type { SecurityEventItem } from '@hookguard/types';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { EmptyState } from '@/components/empty-state';
import { SeverityBadge } from '@/components/severity-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIndexedAt } from '@/lib/format';

export function SecurityTimeline({ events }: { events: SecurityEventItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Timeline</CardTitle>
      </CardHeader>
      <CardContent className={events.length === 0 ? 'p-0' : 'space-y-4'}>
        {events.length === 0 ? (
          <EmptyState
            title="No security events yet"
            description="Run npm run monitor:hooks to snapshot this deployment and record evidence-backed changes. HookGuard does not produce a risk score."
          />
        ) : (
          events.map((event) => (
            <article key={event.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={event.severity} />
                <ConfidenceBadge confidence={event.confidence} />
                <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {event.type.replaceAll('_', ' ')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatIndexedAt(event.detectedAt)}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold leading-snug break-words">
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
              <dl className="mt-3 space-y-1 rounded-lg bg-muted/40 p-3 font-mono text-xs">
                <div className="text-[11px] font-sans font-medium uppercase tracking-wide text-muted-foreground">
                  Evidence
                </div>
                {Object.entries(event.evidence).map(([key, value]) => (
                  <div key={key} className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="min-w-0 break-all whitespace-pre-wrap">
                      {formatValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}
