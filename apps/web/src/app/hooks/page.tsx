import { listSupportedChains } from '@hookguard/blockchain';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { HooksTable } from '@/components/hooks-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchHooksSafe } from '@/lib/api';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Hook Explorer',
};

export const dynamic = 'force-dynamic';

export default async function HookExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ chainId?: string; chain?: string }>;
}) {
  const params = await searchParams;
  const chainId = params.chainId ? Number(params.chainId) : undefined;
  const { hooks, total } = await fetchHooksSafe(
    Number.isInteger(chainId) ? chainId : undefined,
  );
  const chains = listSupportedChains();

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hook Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Uniswap v4 hooks discovered from PoolManager Initialize events.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/hooks"
          className={cn(
            'rounded-full border px-3 py-1 text-xs',
            chainId === undefined
              ? 'border-border bg-muted text-foreground'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          All chains
        </Link>
        {chains.map((chain) => (
          <Link
            key={chain.id}
            href={`/hooks?chainId=${chain.id}`}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              chainId === chain.id
                ? 'border-border bg-muted text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {chain.name}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {total} indexed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <HooksTable hooks={hooks} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
