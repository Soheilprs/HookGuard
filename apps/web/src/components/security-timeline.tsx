import type { SecurityEventItem } from '@hookguard/types';
import { EmptyState } from '@/components/empty-state';
import { Timeline } from '@/components/timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SecurityTimeline({
  events,
  hookAddress,
}: {
  events: SecurityEventItem[];
  hookAddress?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Timeline</CardTitle>
      </CardHeader>
      <CardContent className={events.length === 0 ? 'p-0' : undefined}>
        {events.length === 0 ? (
          <EmptyState
            title="No security events yet"
            description="Run npm run monitor:hooks to snapshot this deployment and record evidence-backed changes. HookGuard does not produce a risk score."
          />
        ) : (
          <Timeline events={events} hookAddress={hookAddress} />
        )}
      </CardContent>
    </Card>
  );
}
