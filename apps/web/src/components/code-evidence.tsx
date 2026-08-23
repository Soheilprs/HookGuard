export function CodeEvidence({
  functionName,
  sourceLocation,
  codeSnippet,
  analysisType,
}: {
  functionName: string | null;
  sourceLocation: string | null;
  codeSnippet: string | null;
  analysisType: string | null;
}) {
  if (!functionName && !sourceLocation && !codeSnippet) return null;

  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-zinc-50 p-3 dark:bg-zinc-900/40">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Code evidence
        {analysisType ? (
          <span className="ml-2 font-mono normal-case tracking-normal">{analysisType}</span>
        ) : null}
      </p>
      <dl className="mt-2 space-y-1 font-mono text-xs">
        {functionName ? (
          <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <dt className="text-muted-foreground">function</dt>
            <dd className="break-all">{functionName}</dd>
          </div>
        ) : null}
        {sourceLocation ? (
          <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <dt className="text-muted-foreground">location</dt>
            <dd>{sourceLocation}</dd>
          </div>
        ) : null}
      </dl>
      {codeSnippet ? (
        <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-md bg-zinc-950/90 p-2 text-[11px] text-zinc-100">
          {codeSnippet}
        </pre>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          No source snippet. Bytecode-only analysis cannot bind this finding to a Solidity span.
        </p>
      )}
    </div>
  );
}
