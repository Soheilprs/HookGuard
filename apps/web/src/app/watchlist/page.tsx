'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/empty-state';
import { ChainBadge } from '@/components/chain-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WatchButton } from '@/components/watch-button';
import { fetchWatchlistSafe } from '@/lib/api';
import { getWatchIdentifier } from '@/lib/watch-id';
import { truncateAddress } from '@/lib/utils';
import type { WatchlistItem } from '@hookguard/types';

export default function WatchlistPage() {
  const [rows, setRows] = useState<WatchlistItem[] | null>(null);

  useEffect(() => {
    const identifier = getWatchIdentifier();
    void fetchWatchlistSafe(identifier).then((payload) => setRows(payload.watchlists));
  }, []);

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hooks you asked HookGuard to watch. Alerts use this browser&apos;s identifier
          until accounts exist. No risk scores.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Watched hooks</CardTitle>
        </CardHeader>
        <CardContent className={rows && rows.length > 0 ? 'space-y-3' : 'p-0'}>
          {rows === null ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">Loading watchlist…</p>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-5 w-5" />}
              title="No watched hooks"
              description="Open a hook page and press Watch hook to receive security-event alerts."
            />
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/public/hooks/${row.hook.address}?chainId=${row.hook.chainId}`}
                    className="font-mono text-sm hover:text-primary"
                  >
                    {truncateAddress(row.hook.address, 6)}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <ChainBadge name={row.hook.chain.name} />
                    <span>{row.hook.poolCount} pools</span>
                  </div>
                </div>
                <WatchButton address={row.hook.address} chainId={row.hook.chainId} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
