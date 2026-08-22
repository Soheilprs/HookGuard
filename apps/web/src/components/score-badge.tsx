import { riskLevelFromScore } from '@hookguard/types';
import { cn } from '@/lib/utils';

const scoreColor: Record<string, string> = {
  unknown: 'bg-muted text-muted-foreground',
  low: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  medium: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  high: 'bg-orange-50 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
  critical: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
};

export function ScoreBadge({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  const level = riskLevelFromScore(score);

  return (
    <span
      className={cn(
        'inline-flex min-w-10 items-center justify-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium',
        scoreColor[level],
        className,
      )}
    >
      {score === null ? '—' : score}
    </span>
  );
}
