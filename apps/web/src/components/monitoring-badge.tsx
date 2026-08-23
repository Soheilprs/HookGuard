import { Badge } from '@/components/ui/badge';

export function MonitoringBadge({ monitored }: { monitored: boolean }) {
  return (
    <Badge variant={monitored ? 'default' : 'outline'}>
      {monitored ? 'Monitored' : 'Not snapshotted'}
    </Badge>
  );
}
