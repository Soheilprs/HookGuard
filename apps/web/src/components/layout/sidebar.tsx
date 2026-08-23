'use client';

import { Bell, BookOpen, FileText, LayoutDashboard, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/hooks', label: 'Hook Explorer', icon: Search },
  { href: '/watchlist', label: 'Watchlist', icon: Bell },
  { href: '/methodology', label: 'Methodology', icon: BookOpen },
  { href: '/research', label: 'Research', icon: FileText },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-background md:block">
      <nav className="sticky top-16 flex flex-col gap-1 p-4">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Platform
        </p>
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                active && 'bg-muted font-medium text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
