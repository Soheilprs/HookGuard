import type { PoolListItem } from '@hookguard/types';
import { formatFeeLabel, formatBlock } from '@/lib/format';
import { truncateAddress } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';

export function PoolsTable({ pools }: { pools: PoolListItem[] }) {
  if (pools.length === 0) {
    return (
      <EmptyState
        title="No pools linked yet"
        description="Pools that initialize with this hook will appear here."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pair</TableHead>
          <TableHead>Fee</TableHead>
          <TableHead>Tick spacing</TableHead>
          <TableHead>Created block</TableHead>
          <TableHead>Pool ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pools.map((pool) => (
          <TableRow key={pool.id}>
            <TableCell>
              <div className="font-medium">{pool.currencyPair}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {truncateAddress(pool.token0Address)} / {truncateAddress(pool.token1Address)}
              </div>
            </TableCell>
            <TableCell>{formatFeeLabel(pool.fee)}</TableCell>
            <TableCell className="font-mono text-sm">{pool.tickSpacing}</TableCell>
            <TableCell className="font-mono text-sm">
              {formatBlock(pool.createdAtBlock)}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {truncateAddress(pool.poolId, 6)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
