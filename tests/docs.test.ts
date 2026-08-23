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
  'docs/RISK-FRAMEWORK.md',
  'docs/research/HOOKGUARD_SECURITY_REPORT.md',
  'docs/research/RISK_FINDINGS_SUMMARY.md',
  'docs/research/CASE_STUDIES.md',
  'docs/research/VALIDATION_REPORT.md',
  'docs/research/SECURITY_PLAYBOOK.md',
  'docs/research/DEVELOPER_GUIDANCE.md',
  'docs/research/RISK_REVIEW_CHECKLIST.md',
  'reports/hookguard-security-landscape.md',
  'reports/hookguard-security-landscape.json',
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

  it('packages a research landscape with evidence, not scores', () => {
    const report = readFileSync(join(root, 'docs/research/HOOKGUARD_SECURITY_REPORT.md'), 'utf8');
    const summary = readFileSync(join(root, 'docs/research/RISK_FINDINGS_SUMMARY.md'), 'utf8');
    const cases = readFileSync(join(root, 'docs/research/CASE_STUDIES.md'), 'utf8');
    const validation = readFileSync(join(root, 'docs/research/VALIDATION_REPORT.md'), 'utf8');
    const landscape = readFileSync(join(root, 'reports/hookguard-security-landscape.md'), 'utf8');
    const landscapeJson = JSON.parse(
      readFileSync(join(root, 'reports/hookguard-security-landscape.json'), 'utf8'),
    ) as {
      metrics: { coverage: { hooksAnalyzed: number; poolsIndexed: number; findings: number } };
      caseStudies: Array<{ evidence: Record<string, unknown> }>;
    };

    expect(report).toMatch(/does not replace a professional smart-contract audit/i);
    expect(report).toMatch(/880/);
    expect(report).toMatch(/2805|2,805/);
    expect(summary).toMatch(/Uniswap Foundation/);
    expect(summary).not.toMatch(/monthly active users/i);
    expect(cases).toMatch(/0x083b8e471227c65579d30fc6a923ea07eecbc080/);
    expect(cases).toMatch(/Do not treat these as accusations/);
    expect(validation).toMatch(/Reviewed hooks/);
    expect(validation).toMatch(/\*\*20\*\*/);
    expect(validation).toMatch(/\*\*135\*\*/);
    expect(validation).toMatch(/not automatically vulnerabilities/);
    expect(landscape).toMatch(/does not replace a professional smart-contract audit/i);
    expect(landscapeJson.metrics.coverage.hooksAnalyzed).toBeGreaterThan(0);
    expect(landscapeJson.caseStudies.every((study) => Object.keys(study.evidence).length > 0)).toBe(
      true,
    );
    expect(report).not.toMatch(/riskScore/);
    expect(summary).toMatch(/not mean confirmed exploits/i);
    expect(summary).not.toMatch(/user funds were stolen/i);
  });

  it('ships a security playbook without exaggerated claims', () => {
    const playbook = readFileSync(join(root, 'docs/research/SECURITY_PLAYBOOK.md'), 'utf8');
    const developer = readFileSync(join(root, 'docs/research/DEVELOPER_GUIDANCE.md'), 'utf8');
    const checklist = readFileSync(join(root, 'docs/research/RISK_REVIEW_CHECKLIST.md'), 'utf8');
    for (const category of [
      'FUND_SAFETY',
      'SWAP_SECURITY',
      'UPGRADE_SECURITY',
      'ADMIN_CONTROL',
      'ORACLE_SECURITY',
      'EXTERNAL_EXECUTION',
    ]) {
      expect(playbook).toContain(category);
      expect(playbook).toMatch(new RegExp(`${category}[\\s\\S]{0,400}What HookGuard detects`));
    }
    expect(playbook).toMatch(/does not replace a professional smart-contract audit/i);
    expect(playbook).not.toMatch(/is malicious/i);
    expect(playbook).not.toMatch(/funds were stolen/i);
    expect(playbook).not.toMatch(/riskScore/);
    expect(developer).toMatch(/Access control/);
    expect(developer).toMatch(/Upgradeability/);
    expect(developer).toMatch(/Swap callbacks/);
    expect(developer).toMatch(/External calls/);
    expect(developer).toMatch(/Oracle configuration/);
    expect(developer).toMatch(/Privileged functions/);
    expect(checklist).toMatch(/Integrators/);
    expect(checklist).toMatch(/Liquidity providers/);
    expect(checklist).toMatch(/Researchers/);
    expect(checklist).toMatch(/Finding → Impact → Evidence → Recommended review/);
  });
});
