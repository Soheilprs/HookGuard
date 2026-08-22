import type { ContractIntelligence } from '@hookguard/types';
import { explorerAddressUrl } from '@hookguard/blockchain';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatIndexedAt } from '@/lib/format';
import { truncateAddress } from '@/lib/utils';
import type { ReactNode } from 'react';

export function ContractIntelligencePanel({
  contract,
}: {
  contract: ContractIntelligence | null;
}) {
  if (!contract) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            title="Contract intelligence not collected yet"
            description="Run the contract inspector to fetch bytecode, source metadata, proxy slots, and permissions."
          />
        </CardContent>
      </Card>
    );
  }

  const implExplorer = contract.implementationAddress
    ? explorerAddressUrl(contract.chainId, contract.implementationAddress)
    : undefined;
  const adminExplorer = contract.adminAddress
    ? explorerAddressUrl(contract.chainId, contract.adminAddress)
    : undefined;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contract Intelligence</CardTitle>
          <Badge variant={contract.sourceVerified ? 'default' : 'muted'}>
            {contract.sourceVerified ? 'Verified source' : 'Unverified'}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Bytecode hash" value={<Mono>{truncateAddress(contract.bytecodeHash, 8)}</Mono>} />
          <Row label="Bytecode size" value={`${contract.bytecodeSize.toLocaleString()} bytes`} />
          <Row label="Last checked" value={formatIndexedAt(contract.lastCheckedAt)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label="Verified"
              value={contract.sourceVerified ? 'Yes' : 'No'}
            />
            <Row
              label="Source URL"
              value={
                contract.sourceUrl ? (
                  <a
                    href={contract.sourceUrl}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                ) : (
                  '—'
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Version" value={contract.compilerVersion ?? '—'} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proxy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Proxy" value={contract.isProxy ? 'Yes' : 'No'} />
          <Row
            label="Implementation"
            value={
              contract.implementationAddress ? (
                implExplorer ? (
                  <a
                    href={implExplorer}
                    className="font-mono text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {truncateAddress(contract.implementationAddress, 6)}
                  </a>
                ) : (
                  <Mono>{truncateAddress(contract.implementationAddress, 6)}</Mono>
                )
              ) : (
                '—'
              )
            }
          />
          <Row
            label="Admin"
            value={
              contract.adminAddress ? (
                adminExplorer ? (
                  <a
                    href={adminExplorer}
                    className="font-mono text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {truncateAddress(contract.adminAddress, 6)}
                  </a>
                ) : (
                  <Mono>{truncateAddress(contract.adminAddress, 6)}</Mono>
                )
              ) : (
                '—'
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Functions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {contract.functions.length === 0 ? (
            <EmptyState title="No functions extracted" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Selector</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Mutability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.functions.map((fn) => (
                  <TableRow key={fn.selector}>
                    <TableCell className="font-mono text-sm">{fn.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {fn.selector}
                    </TableCell>
                    <TableCell>{fn.visibility}</TableCell>
                    <TableCell>{fn.stateMutability}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {contract.permissions.length === 0 ? (
            <EmptyState title="No permissions detected" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.permissions.map((permission) => (
                  <TableRow key={`${permission.type}-${permission.address}-${permission.source}`}>
                    <TableCell>{permission.type}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {truncateAddress(permission.address, 6)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{permission.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
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

function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs">{children}</span>;
}
