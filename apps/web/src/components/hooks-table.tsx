import type { HookListItem } from '@hookguard/types';
import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatIndexedAt } from '@/lib/format';
import { ChainBadge } from '@/components/chain-badge';
import { truncateAddress } from '@/lib/utils';

export function HooksTable({ hooks }: { hooks: HookListItem[] }) {
  if (hooks.length === 0) {
    return (
      <EmptyState
        icon={<ShieldOff className="h-5 w-5" />}
        title="No hooks indexed yet"
        description="Run the Uniswap v4 indexer to populate the registry from PoolManager Initialize events."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hook</TableHead>
          <TableHead>Chain</TableHead>
          <TableHead>Pools</TableHead>
          <TableHead>Last indexed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hooks.map((hook) => (
          <TableRow key={hook.id}>
            <TableCell>
              <Link
                href={`/hooks/${hook.address}?chainId=${hook.chainId}`}
                className="font-mono text-sm hover:text-primary"
              >
                {truncateAddress(hook.address, 6)}
              </Link>
            </TableCell>
            <TableCell>
              <ChainBadge name={hook.chain.name} />
            </TableCell>
            <TableCell className="font-mono text-sm">{hook.poolCount}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatIndexedAt(hook.lastIndexedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
