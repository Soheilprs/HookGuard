export function RiskGuidanceCard({
  guidance,
  category,
}: {
  guidance: string;
  category: string;
}) {
  if (!guidance) return null;

  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-muted/30 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Guidance
        <span className="ml-2 font-mono normal-case tracking-normal">{category}</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{guidance}</p>
    </div>
  );
}
