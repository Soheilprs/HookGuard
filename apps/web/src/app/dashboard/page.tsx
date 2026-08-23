import { Activity, FileCode, Layers, Radio, Search, ShieldAlert } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/empty-state';
import { HooksTable } from '@/components/hooks-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCorpusSafe, fetchHooksSafe } from '@/lib/api';
import { formatIndexedAt } from '@/lib/format';

export const metadata = {
  title: 'Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [stats, list] = await Promise.all([fetchCorpusSafe(), fetchHooksSafe()]);
  const recent = list.hooks.slice(0, 8);

  const cards = [
    { label: 'Hooks indexed', value: String(stats.hooksIndexed), icon: Layers },
    { label: 'Pools tracked', value: String(stats.poolsTracked), icon: Search },
    { label: 'Findings', value: String(stats.findings), icon: ShieldAlert },
    { label: 'Verified source', value: String(stats.verifiedSource), icon: FileCode },
    { label: 'Hooks monitored', value: String(stats.hooksMonitored), icon: Radio },
    {
      label: 'Security events detected',
      value: String(stats.securityEvents),
      icon: Activity,
    },
    {
      label: 'Last monitoring run',
      value: formatIndexedAt(stats.lastMonitoringRun),
      icon: Radio,
    },
  ] as const;

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live snapshot of the HookGuard registry. Findings are evidence-backed.
          Numerical risk scores are not produced.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.slice(0, 4).map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.slice(4).map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent hooks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-5 w-5" />}
              title="No hooks indexed yet"
              description="Newly discovered Uniswap v4 hooks will appear here after you run the indexer."
            />
          ) : (
            <HooksTable hooks={recent} />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
