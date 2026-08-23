import type { SecurityEventItem } from '@hookguard/types';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { EvidenceViewer } from '@/components/evidence-viewer';
import { SeverityBadge } from '@/components/severity-badge';
import { formatIndexedAt } from '@/lib/format';
import { truncateAddress } from '@/lib/utils';

export function SecurityEventCard({
  event,
  hookAddress,
  chainName,
}: {
  event: SecurityEventItem;
  hookAddress?: string;
  chainName?: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={event.severity} />
        <ConfidenceBadge confidence={event.confidence} />
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {event.type.replaceAll('_', ' ')}
        </span>
        <span className="text-xs text-muted-foreground">{formatIndexedAt(event.detectedAt)}</span>
        {hookAddress ? (
          <span className="font-mono text-[11px] text-muted-foreground">
            {truncateAddress(hookAddress, 4)}
            {chainName ? ` · ${chainName}` : ''}
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-sm font-semibold leading-snug break-words">{event.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
      <EvidenceViewer evidence={event.evidence} />
    </article>
  );
}
