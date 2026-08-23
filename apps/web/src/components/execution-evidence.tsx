export function ExecutionEvidence({
  evidence,
  analysisType,
  confidence,
}: {
  evidence: Record<string, unknown>;
  analysisType: string | null;
  confidence: string;
}) {
  const kind = analysisType ?? asString(evidence.analysisType);
  if (kind !== 'BYTECODE_CFG') return null;

  const callback = asString(evidence.callback);
  const opcode = asString(evidence.opcode);
  const pc = evidence.pc;
  const pathLength = evidence.pathLength;

  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-zinc-50 p-3 dark:bg-zinc-900/40">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Execution evidence
      </p>
      <dl className="mt-2 space-y-1 text-sm">
        <Row label="Callback" value={callback ?? '—'} mono />
        <Row label="Opcode" value={opcode ?? '—'} mono />
        <Row label="Program counter" value={pc === undefined || pc === null ? '—' : String(pc)} mono />
        <Row
          label="Path length"
          value={pathLength === undefined || pathLength === null ? '—' : String(pathLength)}
        />
        <Row label="Analysis" value="BYTECODE_CFG" mono />
        <Row label="Confidence" value={confidence} />
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        Unresolved jumps are not followed. This is a review pattern, not a confirmed issue.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-xs break-all' : 'text-xs'}>{value}</dd>
    </div>
  );
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
