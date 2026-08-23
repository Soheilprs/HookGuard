import { describe, expect, it } from 'vitest';
import { RISK_CATEGORIES } from '../analysis/risk/taxonomy.js';
import {
  GUIDANCE_DISCLAIMER,
  PLAYBOOK,
  assertGuidanceHasNoEmptyPlaybook,
  findingGuidanceFor,
  impactExplanationFor,
} from './playbook.js';

const FORBIDDEN = [
  /is malicious/i,
  /are malicious/i,
  /funds were stolen/i,
  /user funds are stolen/i,
  /confirmed exploit\b/i,
  /confirmed vulnerability/i,
  /riskScore/,
];

describe('security playbook', () => {
  it('has guidance and review questions for every risk category', () => {
    assertGuidanceHasNoEmptyPlaybook();
    for (const category of RISK_CATEGORIES) {
      const entry = PLAYBOOK[category];
      expect(entry.detects.length).toBeGreaterThan(10);
      expect(entry.whyItMatters.length).toBeGreaterThan(10);
      expect(entry.evidenceExamples.length).toBeGreaterThan(0);
      expect(entry.reviewSteps.length).toBeGreaterThan(0);
      expect(entry.limitations.length).toBeGreaterThan(10);
      expect(entry.guidance).toMatch(/does not replace a professional smart-contract audit/i);
      expect(entry.reviewQuestions.length).toBeGreaterThan(0);
    }
  });

  it('does not make exaggerated security claims', () => {
    const blob = `${GUIDANCE_DISCLAIMER}\n${Object.values(PLAYBOOK)
      .map((entry) => Object.values(entry).flat().join('\n'))
      .join('\n')}`;
    for (const pattern of FORBIDDEN) {
      expect(blob).not.toMatch(pattern);
    }
  });

  it('attaches guidance to risk and observation findings without requiring new rules', () => {
    const upgrade = findingGuidanceFor({
      category: 'UPGRADE_SECURITY',
      impact: 'SWAP_PATH_LOGIC_REPLACEABLE',
      ruleId: 'risk-upgradeable-swap-control',
    });
    expect(upgrade.guidance).toMatch(/proxy/i);
    expect(upgrade.reviewQuestions.length).toBeGreaterThan(0);
    expect(upgrade.impactExplanation).toMatch(/replace swap-callback logic/i);
    expect(upgrade.impactExplanation).toMatch(/not a confirmed issue/i);

    const observation = findingGuidanceFor({
      category: 'upgradeability',
      impact: null,
      ruleId: 'proxy-used',
    });
    expect(observation.guidance).toMatch(/proxy/i);
    expect(observation.reviewQuestions.length).toBeGreaterThan(0);

    const unknown = findingGuidanceFor({ category: 'other', impact: null, ruleId: 'custom' });
    expect(unknown.guidance).toMatch(/does not replace a professional smart-contract audit/i);
    expect(unknown.reviewQuestions.length).toBeGreaterThan(0);
    expect(unknown.impactExplanation).toBeNull();
  });

  it('explains known impacts and still disclaims confirmed issues', () => {
    const text = impactExplanationFor('PRIVILEGED_TOKEN_MOVEMENT');
    expect(text).toMatch(/token-transfer/i);
    expect(text).toMatch(/not a confirmed issue/i);
  });
});
