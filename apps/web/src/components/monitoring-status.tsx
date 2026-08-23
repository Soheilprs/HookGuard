import type { HookMonitoringStatus } from '@hookguard/types';
import { ChainBadge } from '@/components/chain-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBlock, formatIndexedAt } from '@/lib/format';
import { truncateAddress } from '@/lib/utils';
import type { ReactNode } from 'react';

export function MonitoringStatus({
  chainName,
  status,
}: {
  chainName: string;
  status: HookMonitoringStatus | null;
}) {
  const snapshot = status?.lastSnapshot ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Row label="Chain" value={<ChainBadge name={chainName} />} />
        <Row
          label="Status"
          value={status && status.snapshotCount > 0 ? 'Monitored' : 'Not yet snapshotted'}
        />
        <Row label="Snapshots" value={String(status?.snapshotCount ?? 0)} />
        <Row label="Events" value={String(status?.eventCount ?? 0)} />
        <Row
          label="Last monitoring run"
          value={formatIndexedAt(status?.lastMonitoredAt ?? null)}
        />
        <Row
          label="Snapshot block"
          value={snapshot ? formatBlock(snapshot.blockNumber) : '—'}
        />
        <Row
          label="Implementation"
          value={
            snapshot?.implementationAddress
              ? truncateAddress(snapshot.implementationAddress, 6)
              : '—'
          }
        />
        <Row
          label="Proxy admin"
          value={snapshot?.adminAddress ? truncateAddress(snapshot.adminAddress, 6) : '—'}
        />
        <Row
          label="Owner"
          value={snapshot?.ownerAddress ? truncateAddress(snapshot.ownerAddress, 6) : '—'}
        />
        <Row
          label="Bytecode hash"
          value={
            snapshot?.bytecodeHash
              ? truncateAddress(snapshot.bytecodeHash as `0x${string}`, 8)
              : '—'
          }
        />
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-left font-mono text-xs sm:text-right">{value}</span>
    </div>
  );
}
