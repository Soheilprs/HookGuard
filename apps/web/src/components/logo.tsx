import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-base font-semibold tracking-tight">HookGuard</span>
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('h-7 w-7', className)}
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M16 7.5c-4.8 0-7.5 2.2-7.5 6.2 0 5.4 7.5 11.3 7.5 11.3s7.5-5.9 7.5-11.3c0-4-2.7-6.2-7.5-6.2z"
        fill="none"
        stroke="white"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 15.4c0-1.6 1.2-2.6 2.8-2.6s2.8 1 2.8 2.6c0 .9-.4 1.6-1.1 2l.9 3.1h-5.2l.9-3.1c-.7-.4-1.1-1.1-1.1-2z"
        fill="white"
      />
    </svg>
  );
}
