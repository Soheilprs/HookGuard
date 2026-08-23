import { explorerAddressUrl } from '@hookguard/blockchain';
import { isAddress } from 'viem';
import { ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { ChainBadge } from '@/components/chain-badge';
import { ContractIntelligencePanel } from '@/components/contract-intelligence';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { EmptyState } from '@/components/empty-state';
import { MonitoringBadge } from '@/components/monitoring-badge';
import { MonitoringStatus } from '@/components/monitoring-status';
import { PoolsTable } from '@/components/pools-table';
import { SecurityFindings } from '@/components/security-findings';
import { SecurityTimeline } from '@/components/security-timeline';
import { WatchButton } from '@/components/watch-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchPublicHookSafe } from '@/lib/api';
import { formatBlock, formatIndexedAt } from '@/lib/format';
import { truncateAddress } from '@/lib/utils';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Public hook security',
};

export const dynamic = 'force-dynamic';

export default async function PublicHookPage({
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
  const payload = valid ? await fetchPublicHookSafe(decoded, filterChain) : null;
  const deployments = payload?.deployments ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 py-10">
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
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Public security page
          </p>
          <h1 className="break-all font-mono text-xl font-semibold tracking-tight sm:text-2xl">
            {valid ? decoded : 'Invalid address'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hook address, chain, pools, contract intelligence, findings, events, and
            monitoring status. No numerical security score.
          </p>
        </div>

        {!valid ? (
          <Card>
            <EmptyState
              title="Invalid hook address"
              description="Provide a 20-byte hex address to look up a Uniswap v4 hook."
            />
          </Card>
        ) : payload === null ? (
          <Card>
            <EmptyState
              title="Unable to reach the registry API"
              description="Confirm the API is running and NEXT_PUBLIC_API_URL is set."
            />
          </Card>
        ) : deployments.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ShieldOff className="h-5 w-5" />}
              title="This hook has not been indexed yet"
              description="HookGuard publishes pages only for hooks observed in Uniswap v4 PoolManager Initialize events."
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
              const monitored = deployment.monitoring.snapshotCount > 0;
              return (
                <div key={deployment.hook.id} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <ChainBadge name={deployment.hook.chain.name} />
                    <MonitoringBadge monitored={monitored} />
                    <WatchButton
                      address={deployment.hook.address}
                      chainId={deployment.hook.chainId}
                    />
                  </div>

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

                  <ContractIntelligencePanel contract={deployment.contract} />
                  <SecurityFindings findings={deployment.findings} />
                  <MonitoringStatus
                    chainName={deployment.hook.chain.name}
                    status={deployment.monitoring}
                  />
                  <SecurityTimeline
                    events={deployment.events}
                    hookAddress={deployment.hook.address}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
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
