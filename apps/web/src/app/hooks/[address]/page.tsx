import { isAddress } from 'viem';
import { ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/empty-state';
import { RiskBadge } from '@/components/risk-badge';
import { ScoreBadge } from '@/components/score-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHook, listFindingsForHook, listPoolsForHook } from '@/lib/registry';
import { truncateAddress } from '@/lib/utils';

export const metadata = {
  title: 'Hook',
};

export default async function HookDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const decoded = decodeURIComponent(address);
  const valid = isAddress(decoded);
  const hook = valid ? getHook(decoded) : null;
  const findings = hook ? listFindingsForHook(hook.id) : [];
  const pools = hook ? listPoolsForHook(hook.id) : [];

  return (
    <AppShell>
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/hooks" className="hover:text-foreground">
          Explorer
        </Link>
        <span className="mx-2">/</span>
        <span className="font-mono text-foreground">
          {valid ? truncateAddress(decoded) : 'Unknown'}
        </span>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">
            {valid ? decoded : 'Invalid address'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hook detail. Analysis appears here after the hook is indexed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge score={hook?.riskScore ?? null} />
          <RiskBadge level="unknown" />
        </div>
      </div>

      {!valid ? (
        <Card>
          <EmptyState
            title="Invalid hook address"
            description="Provide a 20-byte hex address to look up a Uniswap v4 hook."
            action={
              <Button asChild variant="outline">
                <Link href="/hooks">Back to explorer</Link>
              </Button>
            }
          />
        </Card>
      ) : !hook ? (
        <Card>
          <EmptyState
            icon={<ShieldOff className="h-5 w-5" />}
            title="This hook has not been indexed yet"
            description="HookGuard will populate metadata, findings, and linked pools once the indexer observes this address on a supported chain."
            action={
              <Button asChild variant="outline">
                <Link href="/hooks">Back to explorer</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Findings</CardTitle>
            </CardHeader>
            <CardContent>
              {findings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No findings yet.</p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pools</CardTitle>
            </CardHeader>
            <CardContent>
              {pools.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pools linked yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
