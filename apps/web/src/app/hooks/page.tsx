import { listSupportedChains } from '@hookguard/blockchain';
import { AppShell } from '@/components/layout/app-shell';
import { HooksTable } from '@/components/hooks-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listHooks } from '@/lib/registry';

export const metadata = {
  title: 'Hook Explorer',
};

export default function HookExplorerPage() {
  const hooks = listHooks();
  const chains = listSupportedChains();

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hook Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse indexed Uniswap v4 hooks across {chains.map((c) => c.name).join(' and ')}.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
          All chains
        </span>
        {chains.map((chain) => (
          <span
            key={chain.id}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
          >
            {chain.name}
          </span>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {hooks.length} indexed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <HooksTable hooks={hooks} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
