import { Layers, Search, ShieldAlert, Sigma } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/empty-state';
import { HooksTable } from '@/components/hooks-table';
import { ScoreBadge } from '@/components/score-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchHooksSafe, fetchStatsSafe } from '@/lib/api';

export const metadata = {
  title: 'Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [stats, list] = await Promise.all([fetchStatsSafe(), fetchHooksSafe()]);
  const recent = list.hooks.slice(0, 8);

  const cards = [
    { label: 'Hooks indexed', value: String(stats.hooksIndexed), icon: Layers },
    { label: 'Pools tracked', value: String(stats.poolsTracked), icon: Search },
    { label: 'Findings', value: String(stats.findings), icon: ShieldAlert },
    { label: 'Average risk', value: stats.averageRisk, icon: Sigma },
  ] as const;

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live snapshot of the HookGuard registry. Risk scoring is not enabled yet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {typeof card.value === 'number' || card.value === null ? (
                <ScoreBadge score={card.value} className="min-w-12 text-lg" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
              )}
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
