import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCorpusSafe } from '@/lib/api';

export const metadata = {
  title: 'Methodology',
};

export const dynamic = 'force-dynamic';

export default async function MethodologyPage() {
  const corpus = await fetchCorpusSafe();

  return (
    <AppShell>
      <div className="mb-8 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Methodology</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          HookGuard is evidence-backed security intelligence for deployed Uniswap
          v4 hooks. It is not a generic scanner, not an AI auditor, and not a
          substitute for a professional smart-contract audit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Hooks analyzed" value={corpus.hooksIndexed} />
        <Stat label="Pools discovered" value={corpus.poolsTracked} />
        <Stat label="Contracts inspected" value={corpus.contractsInspected} />
        <Stat label="Findings generated" value={corpus.findings} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Finding methodology</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Facts</strong> are on-chain
              observations (storage slots, eth_call results, ABI, opcodes).
            </p>
            <p>
              <strong className="text-foreground">Findings</strong> are published
              rules applied to those facts. Every finding includes a rule id,
              evidence, a detection source, and a confidence.
            </p>
            <p>
              <strong className="text-foreground">Severity</strong> is how serious
              the observation would be if the evidence is interpreted in context.
              <strong className="text-foreground"> Confidence</strong> is how
              directly the evidence supports that observation. They are not the
              same.
            </p>
            <p>
              Bytecode-only CALL/DELEGATECALL/STATICCALL findings are{' '}
              <strong className="text-foreground">LOW confidence</strong> heuristics.
              They do not prove a call sits on a swap or liquidity path.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Validated rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Tier 1</strong> — deterministic:
              EIP-1967 slots, hook-address flags, successful owner()/role calls.
            </p>
            <p>
              <strong className="text-foreground">Tier 2</strong> — contextual:
              EOA owner correlated with mutators, ABI privileged functions.
            </p>
            <p>
              <strong className="text-foreground">Tier 3</strong> — heuristic:
              raw opcodes and unnamed selectors. These render with a dashed
              card and a LOW CONFIDENCE label.
            </p>
            <p>
              Manual reviews mark findings CONFIRMED, FALSE_POSITIVE, or
              NEEDS_CONTEXT. HookGuard never auto-confirms.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>What HookGuard does not guarantee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>HookGuard does not replace a professional smart-contract audit.</p>
          <p>
            Absence of findings is not a clean bill of health. Unverified
            bytecode can hide behavior. Heuristic findings can be false
            positives. Verified source improves confidence; it does not prove
            safety.
          </p>
        </CardContent>
      </Card>
    </AppShell>
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
