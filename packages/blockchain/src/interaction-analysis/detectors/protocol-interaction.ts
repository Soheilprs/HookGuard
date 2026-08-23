import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { recoverCallbackInteractions } from '../analysis/external-calls.js';
import { protocolDependencies } from '../analysis/protocol-dependencies.js';
import { interactionEvidence, interactionFinding } from '../emit.js';

export const PROTOCOL_INTERACTION = 'PROTOCOL_INTERACTION';

export const protocolInteractionDetector: AnalysisRule = {
  id: PROTOCOL_INTERACTION,
  run(input: AnalysisInput): EngineFinding[] {
    const calls = recoverCallbackInteractions(input);
    const hits = calls.filter((item) => item.classification === 'KNOWN_PROTOCOL');
    const primary = hits[0];
    if (!primary) return [];
    return [
      interactionFinding({
        ruleId: this.id,
        title: 'Hook callback CALL target matches a known protocol address',
        category: 'EXTERNAL_EXECUTION',
        severity: 'info',
        confidence: 'HIGH',
        ruleTier: 2,
        impact: 'PROTOCOL_CALLBACK_DEPENDENCY',
        affectedComponent: 'hook-callbacks',
        functionName: primary.callback,
        sourceLocation: `pc:${primary.pc}`,
        description:
          'A callback-reachable CALL target equals a curated protocol address (for example Uniswap v4 PoolManager, WETH, Chainlink, Aave). This is a dependency observation, not a confirmed issue.',
        evidence: interactionEvidence(primary, {
          detector: PROTOCOL_INTERACTION,
          dependencies: protocolDependencies(hits),
          calls: hits.map((item) => ({
            callback: item.callback,
            protocolName: item.protocolName,
            targetAddress: item.target.address,
            pc: item.pc,
          })),
        }),
      }),
    ];
  },
};
