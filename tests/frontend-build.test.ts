import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const web = join(root, 'apps/web');

const pages = [
  'src/app/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/hooks/page.tsx',
  'src/app/hooks/[address]/page.tsx',
  'src/app/methodology/page.tsx',
];

const components = [
  'src/components/layout/navbar.tsx',
  'src/components/layout/sidebar.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/table.tsx',
  'src/components/score-badge.tsx',
  'src/components/risk-badge.tsx',
  'src/components/empty-state.tsx',
  'src/components/loading-state.tsx',
  'src/components/contract-intelligence.tsx',
  'src/components/security-findings.tsx',
  'src/components/security-timeline.tsx',
  'src/components/monitoring-status.tsx',
];

describe('frontend foundation', () => {
  it('includes the required pages', () => {
    for (const page of pages) {
      expect(existsSync(join(web, page)), page).toBe(true);
    }
  });

  it('includes the required UI components', () => {
    for (const component of components) {
      expect(existsSync(join(web, component)), component).toBe(true);
    }
  });

  it('does not ship fake security results', () => {
    const explorer = readFileSync(join(web, 'src/app/hooks/page.tsx'), 'utf8');
    const table = readFileSync(join(web, 'src/components/hooks-table.tsx'), 'utf8');
    const detail = readFileSync(
      join(web, 'src/app/hooks/[address]/page.tsx'),
      'utf8',
    );
    const findings = readFileSync(
      join(web, 'src/components/security-findings.tsx'),
      'utf8',
    );
    const intelligence = readFileSync(
      join(web, 'src/components/contract-intelligence.tsx'),
      'utf8',
    );

    expect(explorer + table).toMatch(/No hooks indexed yet/);
    expect(findings).toMatch(/Security Findings/);
    expect(findings).toMatch(/evidence/);
    const confidence = readFileSync(
      join(web, 'src/components/confidence-badge.tsx'),
      'utf8',
    );
    expect(findings).toMatch(/ConfidenceBadge/);
    expect(findings).toMatch(/Bytecode heuristic/);
    expect(confidence).toMatch(/LOW CONFIDENCE/);
    expect(detail).not.toMatch(/Security analysis pending/);
    expect(intelligence).toMatch(/Contract Intelligence/);
    expect(intelligence).toMatch(/Functions/);
    expect(intelligence).toMatch(/Permissions/);
    expect(detail).not.toMatch(/riskScore:\s*[1-9]/);
    expect(findings).not.toMatch(/riskScore/);
    const timeline = readFileSync(
      join(web, 'src/components/security-timeline.tsx'),
      'utf8',
    );
    const monitoring = readFileSync(
      join(web, 'src/components/monitoring-status.tsx'),
      'utf8',
    );
    expect(timeline).toMatch(/Security Timeline/);
    expect(timeline).toMatch(/evidence/i);
    expect(timeline).toMatch(/ConfidenceBadge/);
    expect(timeline).not.toMatch(/riskScore/);
    expect(monitoring).toMatch(/Monitoring Status/);
    expect(detail).toMatch(/SecurityTimeline/);
    expect(detail).toMatch(/MonitoringStatus/);
    expect(detail).not.toMatch(/riskScore/);
  });

  it('is configured as a Next.js app that can build', () => {
    expect(existsSync(join(web, 'next.config.ts'))).toBe(true);
    expect(existsSync(join(web, 'package.json'))).toBe(true);

    const pkg = JSON.parse(readFileSync(join(web, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.build).toContain('next build');
  });
});
