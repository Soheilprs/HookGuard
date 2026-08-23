import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'README.md',
  'docs/ARCHITECTURE.md',
  'docs/SECURITY-METHODOLOGY.md',
  'docs/VALIDATION.md',
  'docs/ROADMAP.md',
  'docs/GRANT.md',
  'docs/DEPLOYMENT.md',
  'docs/OPERATOR.md',
  'docs/DEMO.md',
  'docs/screenshots/homepage.jpg',
  'docs/screenshots/explorer.jpg',
  'docs/screenshots/findings.jpg',
  'docs/screenshots/monitoring.jpg',
];

describe('launch documentation', () => {
  it('includes the required markdown files', () => {
    for (const file of required) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }
  });

  it('states that HookGuard does not replace an audit and does not score risk', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    const method = readFileSync(join(root, 'docs/SECURITY-METHODOLOGY.md'), 'utf8');
    const grant = readFileSync(join(root, 'docs/GRANT.md'), 'utf8');
    const deploy = readFileSync(join(root, 'docs/DEPLOYMENT.md'), 'utf8');
    expect(readme).toMatch(/does not replace a professional smart-contract audit/i);
    expect(method).toMatch(/does not replace a professional smart-contract audit/i);
    expect(grant).toMatch(/880/);
    expect(grant).toMatch(/does not claim users/i);
    expect(grant).toMatch(/Project summary/);
    expect(grant).toMatch(/TVL/);
    expect(deploy).toMatch(/GET \/health/);
    expect(deploy).toMatch(/GET \/ready/);
    expect(readme).toMatch(/badge\/license-MIT/);
    expect(readme).not.toMatch(/monthly active users/i);
    const demo = readFileSync(join(root, 'docs/DEMO.md'), 'utf8');
    expect(demo).toMatch(/Homepage walkthrough/);
    expect(demo).toMatch(/Hook exploration/);
    expect(demo).toMatch(/Findings walkthrough/);
    expect(demo).toMatch(/Monitoring walkthrough/);
  });
});
