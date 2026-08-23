import { Activity, FileCode, Layers, Radio, Search, ShieldAlert } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/empty-state';
import { HooksTable } from '@/components/hooks-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SecurityEventCard } from '@/components/security-event-card';
import {
  fetchCorpusSafe,
  fetchHooksSafe,
  fetchRecentAlertsSafe,
  fetchRecentEventsSafe,
} from '@/lib/api';
import { formatIndexedAt } from '@/lib/format';
import { truncateAddress } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [stats, list, recentEvents, recentAlerts] = await Promise.all([
    fetchCorpusSafe(),
    fetchHooksSafe(),
    fetchRecentEventsSafe(),
    fetchRecentAlertsSafe(),
  ]);
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent changes</CardTitle>
          </CardHeader>
          <CardContent className={recentEvents.events.length === 0 ? 'p-0' : 'space-y-3'}>
            {recentEvents.events.length === 0 ? (
              <EmptyState
                title="No security events yet"
                description="Run the monitoring worker to snapshot hooks and record evidence-backed changes."
              />
            ) : (
              recentEvents.events.map((event) => (
                <SecurityEventCard
                  key={event.id}
                  event={event}
                  hookAddress={event.hook.address}
                  chainName={event.hook.chain.name}
                />
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent alerts</CardTitle>
          </CardHeader>
          <CardContent className={recentAlerts.alerts.length === 0 ? 'p-0' : 'space-y-3'}>
            {recentAlerts.alerts.length === 0 ? (
              <EmptyState
                title="No alerts yet"
                description="Watch a hook to generate pending or Telegram deliveries when security events fire."
              />
            ) : (
              recentAlerts.alerts.map((alert) => (
                <div key={alert.id} className="rounded-xl border border-border p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium uppercase tracking-wide text-foreground">
                      {alert.status}
                    </span>
                    <span className="font-mono">{truncateAddress(alert.hookAddress, 4)}</span>
                    <span>{alert.event.type.replaceAll('_', ' ')}</span>
                  </div>
                  <p className="mt-1 font-medium">{alert.event.title}</p>
                  <Link
                    href={`/public/hooks/${alert.hookAddress}?chainId=${alert.chainId}`}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    Open public page
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
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
