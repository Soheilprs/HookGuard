import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  HIGH: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  MEDIUM:
    'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
  LOW: 'border-dashed border-zinc-300 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
};

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: string;
  className?: string;
}) {
  const key = confidence.toUpperCase();
  const heuristic = key === 'LOW';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[key] ?? styles.MEDIUM,
        className,
      )}
    >
      {heuristic ? 'LOW CONFIDENCE' : `${key.charAt(0)}${key.slice(1).toLowerCase()} confidence`}
    </span>
  );
}
