import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { recoverCallbackInteractions } from '../analysis/external-calls.js';
import { tokenMovements } from '../analysis/token-movement.js';
import { interactionEvidence, interactionFinding } from '../emit.js';

export const TOKEN_MOVEMENT_IN_CALLBACK = 'TOKEN_MOVEMENT_IN_CALLBACK';

export const tokenTransferInCallbackDetector: AnalysisRule = {
  id: TOKEN_MOVEMENT_IN_CALLBACK,
  run(input: AnalysisInput): EngineFinding[] {
    const hits = tokenMovements(recoverCallbackInteractions(input));
    const primary = hits[0];
    if (!primary) return [];
    return [
      interactionFinding({
        ruleId: this.id,
        title: 'Hook callback CALL uses an ERC-20 transfer/approve selector',
        category: 'SWAP_SECURITY',
        severity: 'medium',
        confidence: primary.selector ? 'MEDIUM' : 'LOW',
        ruleTier: 2,
        impact: 'TOKEN_MOVEMENT_IN_CALLBACK',
        affectedComponent: 'swap-callbacks',
        functionName: primary.callback,
        sourceLocation: `pc:${primary.pc}`,
        description:
          'A callback-reachable CALL is preceded by an ERC-20 movement selector (transfer, transferFrom, approve, or permit). This records token-movement behavior on the swap path, not a confirmed loss of funds.',
        evidence: interactionEvidence(primary, {
          detector: TOKEN_MOVEMENT_IN_CALLBACK,
          calls: hits.map((item) => ({
            callback: item.callback,
            selector: item.selector,
            selectorName: item.selectorName,
            targetAddress: item.target.address,
            pc: item.pc,
          })),
        }),
      }),
    ];
  },
};
