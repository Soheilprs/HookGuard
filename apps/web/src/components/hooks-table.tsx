import type { HookSummary } from '@hookguard/types';
import { riskLevelFromScore } from '@hookguard/types';
import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { RiskBadge } from '@/components/risk-badge';
import { ScoreBadge } from '@/components/score-badge';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { truncateAddress } from '@/lib/utils';
import { getChainById } from '@hookguard/blockchain';

export function HooksTable({ hooks }: { hooks: HookSummary[] }) {
  if (hooks.length === 0) {
    return (
      <EmptyState
        icon={<ShieldOff className="h-5 w-5" />}
        title="No hooks indexed yet"
        description="The registry is empty until the indexer starts observing Uniswap v4 PoolManager events."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hook</TableHead>
          <TableHead>Chain</TableHead>
          <TableHead>Creator</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Risk</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hooks.map((hook) => {
          const chain = getChainById(hook.chainId);
          return (
            <TableRow key={hook.id}>
              <TableCell>
                <Link
                  href={`/hooks/${hook.address}`}
                  className="font-mono text-sm hover:text-primary"
                >
                  {truncateAddress(hook.address)}
                </Link>
              </TableCell>
              <TableCell>{chain?.name ?? hook.chainId}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {truncateAddress(hook.creator)}
              </TableCell>
              <TableCell>
                <Badge variant={hook.verifiedSource ? 'default' : 'muted'}>
                  {hook.verifiedSource ? 'Verified' : 'Unverified'}
                </Badge>
              </TableCell>
              <TableCell>
                <ScoreBadge score={hook.riskScore} />
              </TableCell>
              <TableCell>
                <RiskBadge level={riskLevelFromScore(hook.riskScore)} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
