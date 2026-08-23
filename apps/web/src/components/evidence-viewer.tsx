export function EvidenceViewer({ evidence }: { evidence: Record<string, unknown> }) {
  const entries = Object.entries(evidence);
  if (entries.length === 0) return null;

  return (
    <dl className="mt-3 space-y-1 rounded-lg bg-muted/40 p-3 font-mono text-xs">
      <div className="text-[11px] font-sans font-medium uppercase tracking-wide text-muted-foreground">
        Evidence
      </div>
      {entries.map(([key, value]) => (
        <div key={key} className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="min-w-0 break-all whitespace-pre-wrap">{formatEvidenceValue(value)}</dd>
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
