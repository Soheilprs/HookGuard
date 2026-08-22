import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          HookGuard — security intelligence for Uniswap v4 hooks.
        </p>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/hooks" className="hover:text-foreground">
            Explorer
          </Link>
          <a
            href="https://github.com"
            className="hover:text-foreground"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
