import type { SecurityEventItem } from '@hookguard/types';
import { SecurityEventCard } from '@/components/security-event-card';

export function Timeline({
  events,
  hookAddress,
}: {
  events: SecurityEventItem[];
  hookAddress?: string;
}) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <SecurityEventCard key={event.id} event={event} hookAddress={hookAddress} />
      ))}
    </div>
  );
}
