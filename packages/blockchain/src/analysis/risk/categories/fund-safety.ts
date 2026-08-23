import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../types.js';
import { CAPABILITY_DISCLAIMER } from '../taxonomy.js';
import { impactSeverity } from '../impact.js';
import { collectCapabilityFacts } from '../facts.js';

export const privilegedAssetMovementRule: AnalysisRule = {
  id: 'risk-privileged-asset-movement',
  run(input: AnalysisInput): EngineFinding[] {
    const facts = collectCapabilityFacts(input);
    if (facts.tokenMovers.length === 0 || !facts.privilegedControl) return [];

    const named = facts.tokenMovers.some((fn) => fn.name !== 'unknown');
    return [
      {
        ruleId: this.id,
        title: 'Privileged control of token-transfer functions',
        category: 'FUND_SAFETY',
        severity: impactSeverity('PRIVILEGED_TOKEN_MOVEMENT', facts.eoaController),
        confidence: named ? 'HIGH' : 'LOW',
        detectionSource: named ? 'VERIFIED_ABI' : 'BYTECODE_SELECTOR',
        ruleTier: named ? 2 : 3,
        impact: 'PRIVILEGED_TOKEN_MOVEMENT',
        affectedComponent: 'token-movement',
        description: `Token-transfer functions or selectors are present, and an owner/admin was observed. If those functions are reachable, a privileged account may move assets. ${CAPABILITY_DISCLAIMER}`,
        evidence: {
          tokenMovers: facts.tokenMovers.map((fn) => ({
            name: fn.name,
            selector: fn.selector,
          })),
          controllers: facts.controllers,
          eoaController: facts.eoaController,
        },
      },
    ];
  },
};
