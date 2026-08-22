import type { RiskLevel } from '@hookguard/types';
import { cn } from '@/lib/utils';

const labels: Record<RiskLevel, string> = {
  unknown: 'Not scored',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const styles: Record<RiskLevel, string> = {
  unknown: 'border-border bg-muted text-muted-foreground',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  medium:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  high: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300',
  critical:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
};

export function RiskBadge({
  level,
  className,
}: {
  level: RiskLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[level],
        className,
      )}
    >
      {labels[level]}
    </span>
  );
}
