import { ArrowRight, Layers, Search, Shield } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    title: 'Hook Registry',
    description:
      'A canonical catalog of Uniswap v4 hooks across Ethereum and Unichain, with deployment metadata and pool associations.',
    icon: Layers,
  },
  {
    title: 'Security Analysis',
    description:
      'Deterministic checks for hook permissions, lifecycle callbacks, and PoolManager interactions — not a generic contract scanner.',
    icon: Search,
  },
  {
    title: 'Risk Dashboard',
    description:
      'Scores, findings, and empty-until-proven data so LPs and protocols can see what is known before they provide liquidity.',
    icon: Shield,
  },
];

const steps = [
  {
    step: '01',
    title: 'Index hooks',
    body: 'Watch Uniswap v4 PoolManager deployments and initialize events on supported chains.',
  },
  {
    step: '02',
    title: 'Analyze contracts',
    body: 'Inspect bytecode and verified source against a v4-specific security model.',
  },
  {
    step: '03',
    title: 'Score risk',
    body: 'Map structured findings to a reviewable 0–100 score. No invented results.',
  },
];

export default function LandingPage() {
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
              Uniswap v4 security
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Security intelligence for Uniswap v4 hooks
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              HookGuard helps developers, liquidity providers, and researchers
              understand hook risk before capital is at stake.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/hooks">
                  Explore hooks
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">Built for the v4 ecosystem</h2>
            <p className="mt-2 text-muted-foreground">
              Three surfaces. One registry of truth. No placeholder audits.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/40">
          <div className="container py-20">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
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
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold">The registry is live. Indexing is next.</h2>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                  Phase 0 is the foundation: schema, API, and dashboard. Hooks
                  will appear here as they are indexed — never as mock findings.
                </p>
              </div>
              <Button asChild>
                <Link href="/hooks">View explorer</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
