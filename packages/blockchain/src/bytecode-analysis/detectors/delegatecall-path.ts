import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { bytecodeCfgFinding, pathEvidence, primaryHit } from '../emit.js';
import { analyzeHookBytecode } from '../program.js';

export const CALLBACK_REACHABLE_DELEGATECALL = 'CALLBACK_REACHABLE_DELEGATECALL';

export const callbackReachableDelegatecallDetector: AnalysisRule = {
  id: CALLBACK_REACHABLE_DELEGATECALL,
  run(input: AnalysisInput): EngineFinding[] {
    const program = analyzeHookBytecode(input);
    const picked = primaryHit(program.reachability, (row) => row.delegatecall);
    if (!picked) return [];
    const callbacks = program.reachability
      .filter((row) => row.delegatecall.length > 0)
      .map((row) => ({
        callback: row.callback,
        entryPc: row.entryPc,
        delegatecallPc: row.delegatecall[0]?.pc,
        pathLength: row.delegatecall[0]?.pathLength,
      }));
    return [
      bytecodeCfgFinding({
        ruleId: this.id,
        title: 'DELEGATECALL is reachable from a hook lifecycle callback',
        category: 'EXTERNAL_EXECUTION',
        severity: 'medium',
        confidence: picked.row.confidence,
        ruleTier: 2,
        impact: 'CALLBACK_DELEGATE_REACHABLE',
        affectedComponent: 'hook-callbacks',
        functionName: picked.row.callback,
        sourceLocation: `pc:${picked.hit.pc}`,
        description:
          'Control-flow from a recovered Uniswap v4 callback entry reaches DELEGATECALL. This is a security-relevant execution pattern requiring review, not a confirmed issue. Jump targets that cannot be resolved are not followed.',
        evidence: pathEvidence(picked.row.callback, picked.row.entryPc, picked.hit, {
          detector: CALLBACK_REACHABLE_DELEGATECALL,
          callbacks,
          opcodeDelegatecallAlsoPresent: program.opcodeDelegatecall,
        }),
      }),
    ];
  },
};
