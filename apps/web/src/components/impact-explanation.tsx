export function ImpactExplanation({
  impact,
  explanation,
}: {
  impact: string | null;
  explanation: string | null;
}) {
  if (!impact && !explanation) return null;

  return (
    <div className="mt-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Impact
      </p>
      {impact ? <p className="mt-1 font-mono text-xs">{impact}</p> : null}
      <p className="mt-1 text-sm text-muted-foreground">
        {explanation ??
          'Potential impact of the observed capability. Not confirmed exploitation.'}
      </p>
    </div>
  );
}
