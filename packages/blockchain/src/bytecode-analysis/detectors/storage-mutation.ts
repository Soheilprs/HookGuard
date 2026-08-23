import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { bytecodeCfgFinding, pathEvidence, primaryHit } from '../emit.js';
import { analyzeHookBytecode } from '../program.js';

export const CALLBACK_STORAGE_MUTATION = 'CALLBACK_STORAGE_MUTATION';

export const callbackStorageMutationDetector: AnalysisRule = {
  id: CALLBACK_STORAGE_MUTATION,
  run(input: AnalysisInput): EngineFinding[] {
    const program = analyzeHookBytecode(input);
    const picked = primaryHit(program.reachability, (row) => row.sstore);
    if (!picked) return [];
    const callbacks = program.reachability
      .filter((row) => row.sstore.length > 0)
      .map((row) => ({
        callback: row.callback,
        entryPc: row.entryPc,
        sstorePc: row.sstore[0]?.pc,
        pathLength: row.sstore[0]?.pathLength,
      }));
    return [
      bytecodeCfgFinding({
        ruleId: this.id,
        title: 'SSTORE is reachable from a hook lifecycle callback',
        category: 'SWAP_SECURITY',
        severity: 'low',
        confidence: picked.row.confidence,
        ruleTier: 2,
        impact: 'CALLBACK_STATE_MUTATION',
        affectedComponent: 'swap-callbacks',
        functionName: picked.row.callback,
        sourceLocation: `pc:${picked.hit.pc}`,
        description:
          'A hook callback entry can reach SSTORE, so lifecycle execution may modify contract storage. This is a security-relevant execution pattern, not a vulnerability by itself.',
        evidence: pathEvidence(picked.row.callback, picked.row.entryPc, picked.hit, {
          detector: CALLBACK_STORAGE_MUTATION,
          callbacks,
        }),
      }),
    ];
  },
};
