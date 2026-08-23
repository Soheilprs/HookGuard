import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchLandscapeSafe } from '@/lib/api';
import { RISK_CATEGORY_LABELS } from '@hookguard/blockchain';

export const metadata = {
  title: 'Research',
};

export const dynamic = 'force-dynamic';

export default async function ResearchPage() {
  const report = await fetchLandscapeSafe();
  const coverage = report?.metrics.coverage;
  const categories = report?.metrics.riskCategoryHooks;
  const severity = report?.metrics.severityFindings;
  const severityHooks = report?.metrics.severityHooks;
  const confidence = report?.metrics.confidenceFindings;
  const capabilities = report?.metrics.capabilities;

  return (
    <AppShell>
      <div className="mb-8 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Research</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Evidence-backed Uniswap v4 hook landscape. Figures come from this
          API&apos;s indexed corpus. They are not user counts, TVL, or exploit
          proofs. HookGuard does not replace a professional smart-contract audit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Hooks analyzed" value={coverage?.hooksAnalyzed ?? 0} />
        <Stat label="Pools indexed" value={coverage?.poolsIndexed ?? 0} />
        <Stat label="Findings" value={coverage?.findings ?? 0} />
        <Stat label="Monitored hooks" value={coverage?.monitoredHooks ?? 0} />
        <Stat label="Security events" value={coverage?.securityEvents ?? 0} />
        <Stat label="Networks" value={coverage?.networks.length ?? 0} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Methodology</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Discovery → contract intelligence → deterministic rules → risk
              correlation → evidence → validation.
            </p>
            <p>
              Risk categories count <strong className="text-foreground">hooks affected</strong>, not
              raw finding rows. Severity is potential impact, not confirmed
              exploitation. Confidence is evidence strength.
            </p>
            <p>
              <Link href="/methodology" className="text-primary hover:underline">
                Full methodology
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risk categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {categories ? (
              Object.entries(categories).map(([key, count]) => (
                <div key={key} className="flex justify-between gap-4">
                  <span className="font-mono text-xs text-muted-foreground">
                    {key}
                    <span className="ml-2 font-sans text-muted-foreground">
                      {RISK_CATEGORY_LABELS[key as keyof typeof RISK_CATEGORY_LABELS] ?? ''}
                    </span>
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Landscape API unavailable.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Severity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Potential impact of the observed capability. Not confirmed
              exploitation.
            </p>
            {severity && severityHooks ? (
              (
                [
                  ['CRITICAL', severity.critical, severityHooks.critical],
                  ['HIGH', severity.high, severityHooks.high],
                  ['MEDIUM', severity.medium, severityHooks.medium],
                  ['LOW', severity.low, severityHooks.low],
                ] as const
              ).map(([label, findings, hooks]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">
                    {findings.toLocaleString()} findings / {hooks.toLocaleString()} hooks
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Landscape API unavailable.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Confidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Evidence strength. Not whether an attack occurred.
            </p>
            {confidence ? (
              (
                [
                  ['CONFIRMED', confidence.CONFIRMED],
                  ['STRONG', confidence.STRONG],
                  ['OBSERVED', confidence.OBSERVED],
                ] as const
              ).map(([label, count]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{count.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Landscape API unavailable.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Hook capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          {capabilities ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
              <Cap label="beforeSwap" value={capabilities.beforeSwap} />
              <Cap label="afterSwap" value={capabilities.afterSwap} />
              <Cap label="beforeAddLiquidity" value={capabilities.beforeAddLiquidity} />
              <Cap label="afterAddLiquidity" value={capabilities.afterAddLiquidity} />
              <Cap label="Upgradeable (proxy)" value={capabilities.upgradeable} />
              <Cap label="Privileged admin" value={capabilities.privilegedAdmin} />
              <Cap label="External execution" value={capabilities.externalExecution} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Landscape API unavailable.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Generated reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Operators generate a snapshot with <span className="font-mono">npm run report:risk</span>.
            Files: <span className="font-mono">reports/hookguard-security-landscape.md</span> and{' '}
            <span className="font-mono">.json</span>. Analyzer corpus research:{' '}
            <span className="font-mono">npm run analyze:hooks:research</span> writes{' '}
            <span className="font-mono">reports/hookguard-security-analysis-results.md</span> and{' '}
            <span className="font-mono">reports/evidence/</span>. Bytecode CFG:{' '}
            <span className="font-mono">npm run analyze:bytecode</span> writes{' '}
            <span className="font-mono">reports/bytecode-analysis-results.md</span>.
          </p>
          <p>
            Written research package:{' '}
            <span className="font-mono">docs/research/</span> (security report, findings
            summary, case studies, validation, playbook, developer guidance, review
            checklist).
          </p>
          <p>
            Findings render as Finding → Impact → Evidence → Recommended review.
            Guidance is derived from category and impact. It is not a score and not
            a new detector.
          </p>
          {report ? (
            <p className="text-xs">Last live aggregation: {report.generatedAt}</p>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function Cap({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value.toLocaleString()}</p>
    </div>
  );
}
