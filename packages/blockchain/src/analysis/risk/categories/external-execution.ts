import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../types.js';
import { CAPABILITY_DISCLAIMER } from '../taxonomy.js';
import { collectCapabilityFacts } from '../facts.js';

export const callbackExternalExecutionRule: AnalysisRule = {
  id: 'risk-callback-external-execution',
  run(input: AnalysisInput): EngineFinding[] {
    const facts = collectCapabilityFacts(input);
    const opcode = facts.callPresent || facts.delegatecallPresent;
    if (facts.lifecycleCallbacks.length === 0 || !opcode) return [];

    const sourceBound = facts.sourceLifecycleCalls.length > 0;
    const kinds = [
      facts.callPresent ? 'CALL' : null,
      facts.delegatecallPresent ? 'DELEGATECALL' : null,
    ].filter(Boolean);

    return [
      {
        ruleId: this.id,
        title: sourceBound
          ? 'Verified source associates external calls with hook callbacks'
          : 'External CALL/DELEGATECALL present alongside hook callbacks',
        category: 'EXTERNAL_EXECUTION',
        severity: 'low',
        confidence: sourceBound ? 'MEDIUM' : 'LOW',
        detectionSource: sourceBound ? 'VERIFIED_SOURCE' : 'BYTECODE_OPCODE',
        ruleTier: sourceBound ? 2 : 3,
        impact: 'CALLBACK_EXTERNAL_CALL',
        affectedComponent: 'hook-callbacks',
        description: sourceBound
          ? `Verified source associates ${kinds.join('/')} with lifecycle function(s) ${facts.sourceLifecycleCalls.join(', ')}. Reachability is source-based, not a CFG proof. ${CAPABILITY_DISCLAIMER}`
          : `Hook callback(s) ${facts.lifecycleCallbacks.join(', ')} were observed and ${kinds.join('/')} exists in runtime bytecode. This does not prove the call is reachable from beforeSwap or afterSwap. ${CAPABILITY_DISCLAIMER}`,
        evidence: {
          lifecycleCallbacks: facts.lifecycleCallbacks,
          callPresent: facts.callPresent,
          delegatecallPresent: facts.delegatecallPresent,
          sourceLifecycleCalls: facts.sourceLifecycleCalls,
          reachableFromHookCallback: sourceBound,
        },
      },
    ];
  },
};
