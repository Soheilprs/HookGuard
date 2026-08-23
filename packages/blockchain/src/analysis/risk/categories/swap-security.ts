import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../types.js';
import { CAPABILITY_DISCLAIMER } from '../taxonomy.js';
import { impactSeverity } from '../impact.js';
import { collectCapabilityFacts } from '../facts.js';

export const privilegedFeeModificationRule: AnalysisRule = {
  id: 'risk-privileged-fee-modification',
  run(input: AnalysisInput): EngineFinding[] {
    const facts = collectCapabilityFacts(input);
    if (
      facts.swapCallbacks.length === 0 ||
      facts.feeSetters.length === 0 ||
      !facts.privilegedControl
    ) {
      return [];
    }

    const named = facts.feeSetters.some((fn) => fn.name !== 'unknown');
    return [
      {
        ruleId: this.id,
        title: 'Privileged control of swap fees',
        category: 'SWAP_SECURITY',
        severity: impactSeverity('PRIVILEGED_FEE_CHANGE', facts.eoaController),
        confidence: named ? 'HIGH' : 'LOW',
        detectionSource: named ? 'VERIFIED_ABI' : 'BYTECODE_SELECTOR',
        ruleTier: named ? 2 : 3,
        impact: 'PRIVILEGED_FEE_CHANGE',
        affectedComponent: 'fee-controller',
        description: `Swap callback(s) ${facts.swapCallbacks.join(', ')} are present together with a fee setter and an owner/admin. A privileged account may change swap fees. ${CAPABILITY_DISCLAIMER}`,
        evidence: {
          swapCallbacks: facts.swapCallbacks,
          feeSetters: facts.feeSetters.map((fn) => ({
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
