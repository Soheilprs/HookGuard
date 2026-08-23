import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { recoverCallbackInteractions } from '../analysis/external-calls.js';
import { interactionEvidence, interactionFinding } from '../emit.js';

export const USER_CONTROLLED_EXTERNAL_EXECUTION = 'USER_CONTROLLED_EXTERNAL_EXECUTION';

export const userControlledCallDetector: AnalysisRule = {
  id: USER_CONTROLLED_EXTERNAL_EXECUTION,
  run(input: AnalysisInput): EngineFinding[] {
    const hits = recoverCallbackInteractions(input).filter(
      (item) => item.classification === 'USER_CONTROLLED' || item.target.origin === 'CALLDATA',
    );
    const primary = hits[0];
    if (!primary) return [];
    return [
      interactionFinding({
        ruleId: this.id,
        title: 'Hook callback CALL target is derived from calldata',
        category: 'EXTERNAL_EXECUTION',
        severity: 'medium',
        confidence: 'MEDIUM',
        ruleTier: 2,
        impact: 'USER_CONTROLLED_CALLBACK_TARGET',
        affectedComponent: 'hook-callbacks',
        functionName: primary.callback,
        sourceLocation: `pc:${primary.pc}`,
        description:
          'Abstract stack tracking shows the CALL target originates from calldata. The hook callback may execute logic against a dynamically selected target. This is not a vulnerability by itself.',
        evidence: interactionEvidence(primary, {
          detector: USER_CONTROLLED_EXTERNAL_EXECUTION,
          calls: hits.map((item) => ({
            callback: item.callback,
            pc: item.pc,
            origin: item.target.origin,
          })),
        }),
      }),
    ];
  },
};
