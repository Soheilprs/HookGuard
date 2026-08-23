import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../types.js';
import { CAPABILITY_DISCLAIMER } from '../taxonomy.js';
import { impactSeverity } from '../impact.js';
import { collectCapabilityFacts } from '../facts.js';

export const privilegedOracleModificationRule: AnalysisRule = {
  id: 'risk-privileged-oracle-modification',
  run(input: AnalysisInput): EngineFinding[] {
    const facts = collectCapabilityFacts(input);
    if (
      facts.oracleSetters.length === 0 ||
      !facts.privilegedControl ||
      facts.priceSensitiveCallbacks.length === 0
    ) {
      return [];
    }

    const named = facts.oracleSetters.some((fn) => fn.name !== 'unknown');
    return [
      {
        ruleId: this.id,
        title: 'Privileged control of an oracle used with price-sensitive callbacks',
        category: 'ORACLE_SECURITY',
        severity: impactSeverity('PRIVILEGED_ORACLE_CHANGE', facts.eoaController),
        confidence: named ? 'HIGH' : 'LOW',
        detectionSource: named ? 'VERIFIED_ABI' : 'BYTECODE_SELECTOR',
        ruleTier: named ? 2 : 3,
        impact: 'PRIVILEGED_ORACLE_CHANGE',
        affectedComponent: 'oracle',
        description: `An oracle setter, an owner/admin, and price-sensitive callback(s) ${facts.priceSensitiveCallbacks.join(', ')} were observed together. A privileged account may change the oracle used around swaps. ${CAPABILITY_DISCLAIMER}`,
        evidence: {
          oracleSetters: facts.oracleSetters.map((fn) => ({
            name: fn.name,
            selector: fn.selector,
          })),
          priceSensitiveCallbacks: facts.priceSensitiveCallbacks,
          controllers: facts.controllers,
          eoaController: facts.eoaController,
        },
      },
    ];
  },
};
