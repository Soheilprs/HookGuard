import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../types.js';
import { CAPABILITY_DISCLAIMER } from '../taxonomy.js';
import { impactSeverity } from '../impact.js';
import { collectCapabilityFacts } from '../facts.js';

export const privilegedAdminControlRule: AnalysisRule = {
  id: 'risk-privileged-admin-control',
  run(input: AnalysisInput): EngineFinding[] {
    const facts = collectCapabilityFacts(input);
    if (!facts.privilegedControl || facts.adminMutators.length === 0) return [];

    return [
      {
        ruleId: this.id,
        title: 'Privileged administrative control of hook configuration',
        category: 'ADMIN_CONTROL',
        severity: impactSeverity('PRIVILEGED_CONFIGURATION', facts.eoaController),
        confidence: 'HIGH',
        detectionSource: 'ONCHAIN_CALL',
        ruleTier: 2,
        impact: 'PRIVILEGED_CONFIGURATION',
        affectedComponent: 'owner-admin',
        description: `An owner/admin was observed together with configuration mutators (${facts.adminMutators.map((fn) => fn.name).join(', ')}). That is privileged control of hook configuration, not by itself a critical finding. ${CAPABILITY_DISCLAIMER}`,
        evidence: {
          controllers: facts.controllers,
          adminMutators: facts.adminMutators.map((fn) => ({
            name: fn.name,
            selector: fn.selector,
          })),
          eoaController: facts.eoaController,
        },
      },
    ];
  },
};
