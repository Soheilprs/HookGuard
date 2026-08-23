import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { recoverCallbackInteractions } from '../analysis/external-calls.js';
import { interactionEvidence, interactionFinding } from '../emit.js';

export const UNKNOWN_EXTERNAL_TARGET = 'UNKNOWN_EXTERNAL_TARGET';

export const unknownExternalTargetDetector: AnalysisRule = {
  id: UNKNOWN_EXTERNAL_TARGET,
  run(input: AnalysisInput): EngineFinding[] {
    const hits = recoverCallbackInteractions(input).filter(
      (item) =>
        item.opcode === 'CALL' &&
        (item.classification === 'UNKNOWN_CONTRACT' || item.classification === 'DYNAMIC'),
    );
    const primary = hits[0];
    if (!primary) return [];
    return [
      interactionFinding({
        ruleId: this.id,
        title: 'Hook callback CALL target is not a known constant protocol',
        category: 'EXTERNAL_EXECUTION',
        severity: 'low',
        confidence: primary.target.confidence,
        ruleTier: 2,
        impact: 'UNKNOWN_CALLBACK_TARGET',
        affectedComponent: 'hook-callbacks',
        functionName: primary.callback,
        sourceLocation: `pc:${primary.pc}`,
        description:
          'A recovered callback path performs CALL to a target that is unknown, storage-loaded, or dynamically computed. This is a review pattern, not a confirmed issue.',
        evidence: interactionEvidence(primary, {
          detector: UNKNOWN_EXTERNAL_TARGET,
          calls: hits.map((item) => ({
            callback: item.callback,
            pc: item.pc,
            targetAddress: item.target.address,
            targetType: item.classification,
          })),
        }),
      }),
    ];
  },
};
