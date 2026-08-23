import { Badge } from '@/components/ui/badge';

export function ChainBadge({ name }: { name: string }) {
  return <Badge variant="outline">{name}</Badge>;
}
