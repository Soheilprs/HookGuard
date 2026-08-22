export function AnalysisPending() {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
      <p className="font-medium">Security analysis pending</p>
      <p className="mt-0.5 text-muted-foreground">
        HookGuard has indexed this hook. Findings and risk scores are not
        produced in this phase.
      </p>
    </div>
  );
}
