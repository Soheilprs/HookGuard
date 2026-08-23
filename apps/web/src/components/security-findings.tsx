import type { FindingItem } from '@hookguard/types';
import { EmptyState } from '@/components/empty-state';
import { FindingCard } from '@/components/finding-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SecurityFindings({ findings }: { findings: FindingItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Findings</CardTitle>
      </CardHeader>
      <CardContent className={findings.length === 0 ? 'p-0' : 'space-y-4'}>
        {findings.length === 0 ? (
          <EmptyState
            title="No findings yet"
            description="Run the analysis engine to produce evidence-based observations. HookGuard does not invent scores or unsubstantiated vulnerabilities."
          />
        ) : (
          findings.map((finding) => <FindingCard key={finding.ruleId} finding={finding} />)
        )}
      </CardContent>
    </Card>
  );
}
