import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { bytecodeCfgFinding, pathEvidence, primaryHit } from '../emit.js';
import { analyzeHookBytecode } from '../program.js';

export const CALLBACK_EXTERNAL_CALL = 'CALLBACK_EXTERNAL_CALL';

export const callbackExternalCallDetector: AnalysisRule = {
  id: CALLBACK_EXTERNAL_CALL,
  run(input: AnalysisInput): EngineFinding[] {
    const program = analyzeHookBytecode(input);
    const picked = primaryHit(program.reachability, (row) => row.call);
    if (!picked) return [];
    const callbacks = program.reachability
      .filter((row) => row.call.length > 0)
      .map((row) => ({
        callback: row.callback,
        entryPc: row.entryPc,
        callPc: row.call[0]?.pc,
        pathLength: row.call[0]?.pathLength,
      }));
    return [
      bytecodeCfgFinding({
        ruleId: this.id,
        title: 'CALL is reachable from a hook lifecycle callback',
        category: 'EXTERNAL_EXECUTION',
        severity: 'low',
        confidence: picked.row.confidence,
        ruleTier: 2,
        impact: 'CALLBACK_CALL_REACHABLE',
        affectedComponent: 'hook-callbacks',
        functionName: picked.row.callback,
        sourceLocation: `pc:${picked.hit.pc}`,
        description:
          'Control-flow from a recovered Uniswap v4 callback entry reaches CALL. Target address is not recovered unless it is an immediate on the abstract stack. This is a review pattern, not a confirmed issue.',
        evidence: pathEvidence(picked.row.callback, picked.row.entryPc, picked.hit, {
          detector: CALLBACK_EXTERNAL_CALL,
          callbacks,
          target: picked.hit.target,
        }),
      }),
    ];
  },
};
