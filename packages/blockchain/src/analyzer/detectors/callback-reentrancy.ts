import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { analyzerFinding } from '../emit.js';
import { buildHookProgram } from '../hooks/lifecycle.js';
import { findExternalCalls, findStateWrites } from '../hooks/patterns.js';

export const CALLBACK_REENTRANCY_RULE_ID = 'CALLBACK_REENTRANCY_RISK';

export const callbackReentrancyDetector: AnalysisRule = {
  id: CALLBACK_REENTRANCY_RULE_ID,
  run(input: AnalysisInput): EngineFinding[] {
    const program = buildHookProgram(input);
    const hits = program.lifecycleFunctions
      .map((fn) => {
        const calls = findExternalCalls(fn.strippedBody).filter((site) => site.kind === 'call');
        const writes = findStateWrites(fn.strippedBody);
        if (calls.length === 0 || writes.length === 0) return null;
        const firstCall = Math.min(...calls.map((site) => site.index));
        const lastWrite = Math.max(...writes.map((site) => site.index));
        if (lastWrite <= firstCall) return null;
        return { fn, calls, writes, firstCall, lastWrite };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (hits.length === 0) return [];
    const primary = hits[0];
    if (!primary) return [];

    return [
      analyzerFinding({
        ruleId: this.id,
        title: 'Hook callback performs an external call before a later state update',
        category: 'reentrancy',
        severity: 'medium',
        confidence: 'MEDIUM',
        detectionSource: 'VERIFIED_SOURCE',
        ruleTier: 2,
        impact: 'CALLBACK_REENTRANCY_WINDOW',
        affectedComponent: 'hook-callbacks',
        analysisType: 'SOURCE',
        fn: primary.fn,
        description:
          'A listed Uniswap v4 lifecycle callback contains an external CALL and a later state update. That ordering is a reentrancy-window review signal, not a confirmed issue.',
        evidence: {
          callbacks: hits.map((hit) => hit.fn.name),
          callTargets: primary.calls.map((site) => site.target),
          stateWrites: primary.writes.map((site) => site.text),
          callBeforeLaterWrite: true,
        },
      }),
    ];
  },
};
