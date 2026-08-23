import { ArrowRight, Eye, Layers, Search } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCorpusSafe } from '@/lib/api';
import { PUBLISHED_CORPUS } from '@/lib/published-corpus';

export const metadata = {
  title: 'HookGuard',
  description:
    'Evidence-backed security intelligence for deployed Uniswap v4 hooks. Not an audit. Not a risk score.',
};

export const dynamic = 'force-dynamic';

const steps = [
  {
    step: '01',
    title: 'Discover',
    body: 'Index Uniswap v4 PoolManager Initialize events on Ethereum and Unichain. Zero-address hooks are skipped.',
  },
  {
    step: '02',
    title: 'Inspect',
    body: 'Read bytecode, EIP-1967 slots, owner() / roles, and optional verified source. Facts first.',
  },
  {
    step: '03',
    title: 'Publish findings',
    body: 'Rules emit severity, confidence, detection source, and evidence. Heuristics are labeled LOW CONFIDENCE.',
  },
  {
    step: '04',
    title: 'Watch',
    body: 'Snapshot implementation, admin, owner, and bytecode. Alert on change — Telegram optional.',
  },
];

const roadmap = [
  { label: 'Shipped', body: 'Registry, intelligence, findings, validation, monitoring, public pages, watchlists.' },
  { label: 'Now', body: 'Launch documentation, deployment notes, grant draft. No new speculative detectors.' },
  { label: 'Next', body: 'Archive RPC, verified-source coverage, operator scheduling. Still no risk scores.' },
];

export default async function LandingPage() {
  const corpus = await fetchCorpusSafe();
  const live = corpus.hooksIndexed > 0;
  const hooks = live ? corpus.hooksIndexed : PUBLISHED_CORPUS.hooks;
  const pools = live ? corpus.poolsTracked : PUBLISHED_CORPUS.pools;
  const findings = live ? corpus.findings : PUBLISHED_CORPUS.findings;
  const inspected = live ? corpus.contractsInspected : PUBLISHED_CORPUS.inspected;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px] opacity-40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="container relative py-24 sm:py-32">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Uniswap v4 hooks
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Evidence-backed security intelligence for deployed hooks
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Inspect the contract that actually runs inside a v4 pool — flags,
              proxies, owners, and change events — without a made-up score.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/hooks">
                  Explore hooks
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/methodology">Read the methodology</Link>
              </Button>
            </div>
            <p className="mt-6 max-w-xl text-xs text-muted-foreground">
              HookGuard does not replace a professional smart-contract audit.
            </p>
          </div>
        </section>

        <section className="container py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">Problem</h2>
            <p className="mt-2 text-muted-foreground">
              A Uniswap v4 pool can attach a hook. That hook runs in the swap and
              liquidity path. The pool manager will only call callbacks whose bits
              are set on the hook address — but the implementation can still be a
              proxy, an EOA-owned setter, or unverified bytecode. A directory of
              addresses is not enough. A generic scanner that ignores{' '}
              <span className="font-mono text-foreground">PoolManager</span> is not
              enough.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" />
                </div>
                <CardTitle>Hooks are in-path</CardTitle>
                <CardDescription>
                  Callbacks can change fees, call out, or upgrade while the pool is
                  servicing swaps.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Search className="h-4 w-4" />
                </div>
                <CardTitle>Audits are a snapshot</CardTitle>
                <CardDescription>
                  Implementation slots and owners can change after a listing or an
                  audit subsidy.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Eye className="h-4 w-4" />
                </div>
                <CardTitle>Evidence, not a score</CardTitle>
                <CardDescription>
                  HookGuard shows what it observed and how. It does not invent a
                  0–100 risk number.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="border-y border-border bg-muted/40">
          <div className="container py-20">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((item) => (
                <div key={item.step}>
                  <p className="font-mono text-xs font-medium text-primary">{item.step}</p>
                  <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">Coverage metrics</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {live
                ? 'Live counts from this HookGuard API.'
                : `Published corpus from the Phase 2C validation run (${PUBLISHED_CORPUS.asOf}). Not a user-count.`}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Unique hooks" value={hooks} />
            <Stat label="Pools discovered" value={pools} />
            <Stat label="Contracts inspected" value={inspected} />
            <Stat label="Findings generated" value={findings} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Ethereum {PUBLISHED_CORPUS.ethereumHooks} hooks / {PUBLISHED_CORPUS.ethereumPools}{' '}
            pools. Unichain {PUBLISHED_CORPUS.unichainHooks} hooks /{' '}
            {PUBLISHED_CORPUS.unichainPools} pools. Verified source in that run:{' '}
            {PUBLISHED_CORPUS.verifiedSource}. Manually reviewed:{' '}
            {PUBLISHED_CORPUS.reviewedHooks} hooks, {PUBLISHED_CORPUS.reviewedFindings} findings.
          </p>
        </section>

        <section className="border-y border-border bg-muted/40">
          <div className="container py-20">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight">Methodology</h2>
              <p className="mt-2 text-muted-foreground">
                Facts are storage words, calls, and opcodes. Findings are published
                rules. Severity is not confidence. Heuristic CALL opcodes are labeled
                LOW CONFIDENCE — they do not prove a swap-path call.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Tier 1</CardTitle>
                  <CardDescription>Deterministic slots, flags, successful owner().</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tier 2</CardTitle>
                  <CardDescription>
                    Contextual: EOA owner only with discovered mutators.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tier 3</CardTitle>
                  <CardDescription>
                    Heuristic opcodes and unnamed selectors. Never visually equal to a
                    fact.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/methodology">
                Full methodology
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="container py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Roadmap</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {roadmap.map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {item.label}
                  </p>
                  <CardDescription className="pt-2">{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border">
          <div className="container py-20">
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold">Inspect a deployed hook</h2>
                  <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                    Open the explorer or a public security page. Findings always
                    include evidence. HookGuard does not replace a professional
                    smart-contract audit.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/hooks">View explorer</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
