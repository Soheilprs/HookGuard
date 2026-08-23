import { explorerAddressUrl } from '@hookguard/blockchain';
import { isAddress } from 'viem';
import { ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { ChainBadge } from '@/components/chain-badge';
import { ContractIntelligencePanel } from '@/components/contract-intelligence';
import { SecurityFindings } from '@/components/security-findings';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/empty-state';
import { PoolsTable } from '@/components/pools-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonitoringBadge } from '@/components/monitoring-badge';
import { MonitoringStatus } from '@/components/monitoring-status';
import { SecurityTimeline } from '@/components/security-timeline';
import { WatchButton } from '@/components/watch-button';
import {
  fetchHookContractSafe,
  fetchHookEventsSafe,
  fetchHookFindingsSafe,
  fetchHookMonitoringSafe,
  fetchHookSafe,
} from '@/lib/api';
import { formatBlock, formatIndexedAt } from '@/lib/format';
import { truncateAddress } from '@/lib/utils';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Hook',
};

export const dynamic = 'force-dynamic';

export default async function HookDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ chainId?: string }>;
}) {
  const { address } = await params;
  const query = await searchParams;
  const decoded = decodeURIComponent(address);
  const valid = isAddress(decoded, { strict: false });
  const chainId = query.chainId ? Number(query.chainId) : undefined;
  const filterChain = Number.isInteger(chainId) ? chainId : undefined;
  const [payload, contractPayload, findingsPayload, eventsPayload, monitoringPayload] = valid
    ? await Promise.all([
        fetchHookSafe(decoded, filterChain),
        fetchHookContractSafe(decoded, filterChain),
        fetchHookFindingsSafe(decoded, filterChain),
        fetchHookEventsSafe(decoded, filterChain),
        fetchHookMonitoringSafe(decoded, filterChain),
      ])
    : [null, null, null, null, null];
  const deployments = payload?.deployments ?? [];
  const contractsByChain = new Map(
    (contractPayload?.deployments ?? []).map((row) => [row.hook.chainId, row.contract]),
  );
  const findingsByChain = new Map(
    (findingsPayload?.deployments ?? []).map((row) => [row.hook.chainId, row.findings]),
  );
  const eventsByChain = new Map(
    (eventsPayload?.deployments ?? []).map((row) => [row.hook.chainId, row.events]),
  );
  const monitoringByChain = new Map(
    (monitoringPayload?.deployments ?? []).map((row) => [row.hook.chainId, row.monitoring]),
  );

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

      <div className="mb-8">
        <h1 className="break-all font-mono text-xl font-semibold tracking-tight sm:text-2xl">
          {valid ? decoded : 'Invalid address'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Evidence-backed security intelligence for a deployed Uniswap v4 hook.
          Numerical scores are not produced.
        </p>
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
      ) : payload === null ? (
        <Card>
          <EmptyState
            title="Unable to reach the registry API"
            description="The dashboard could not load hook data. Confirm the API is running and NEXT_PUBLIC_API_URL is set."
            action={
              <Button asChild variant="outline">
                <Link href="/hooks">Back to explorer</Link>
              </Button>
            }
          />
        </Card>
      ) : deployments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShieldOff className="h-5 w-5" />}
            title="This hook has not been indexed yet"
            description="HookGuard will populate metadata and linked pools once the indexer observes this address on a supported chain."
            action={
              <Button asChild variant="outline">
                <Link href="/hooks">Back to explorer</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {deployments.map((deployment) => {
            const explorer = explorerAddressUrl(
              deployment.hook.chainId,
              deployment.hook.address,
            );
            const monitored =
              (monitoringByChain.get(deployment.hook.chainId)?.snapshotCount ?? 0) > 0;
            return (
              <div key={deployment.hook.id} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ChainBadge name={deployment.hook.chain.name} />
                  <MonitoringBadge monitored={monitored} />
                  <WatchButton
                    address={deployment.hook.address}
                    chainId={deployment.hook.chainId}
                  />
                  <Link
                    href={`/public/hooks/${deployment.hook.address}?chainId=${deployment.hook.chainId}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Public page
                  </Link>
                </div>

                <SecurityFindings
                  findings={findingsByChain.get(deployment.hook.chainId) ?? []}
                />

                <MonitoringStatus
                  chainName={deployment.hook.chain.name}
                  status={monitoringByChain.get(deployment.hook.chainId) ?? null}
                />

                <SecurityTimeline
                  events={eventsByChain.get(deployment.hook.chainId) ?? []}
                  hookAddress={deployment.hook.address}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Hook</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <Row
                        label="Chain"
                        value={<ChainBadge name={deployment.hook.chain.name} />}
                      />
                      <Row
                        label="Address"
                        value={
                          explorer ? (
                            <a
                              href={explorer}
                              className="font-mono text-primary hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {deployment.hook.address}
                            </a>
                          ) : (
                            <span className="font-mono">{deployment.hook.address}</span>
                          )
                        }
                      />
                      <Row
                        label="First seen block"
                        value={formatBlock(deployment.hook.firstSeenBlock)}
                      />
                      <Row
                        label="Last seen block"
                        value={formatBlock(deployment.hook.lastSeenBlock)}
                      />
                      <Row
                        label="Last indexed"
                        value={formatIndexedAt(deployment.hook.lastIndexedAt)}
                      />
                      <Row label="Pools" value={String(deployment.hook.poolCount)} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Pools using this hook</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <PoolsTable pools={deployment.pools} />
                    </CardContent>
                  </Card>
                </div>

                <ContractIntelligencePanel
                  contract={contractsByChain.get(deployment.hook.chainId) ?? null}
                />
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-left sm:text-right">{value}</span>
    </div>
  );
}
