import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { bytecodeCfgFinding } from '../emit.js';
import { BYTECODE_CFG, analyzeHookBytecode } from '../program.js';

export const CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE =
  'CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE';

export const callbackCallBeforeStorageDetector: AnalysisRule = {
  id: CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE,
  run(input: AnalysisInput): EngineFinding[] {
    const program = analyzeHookBytecode(input);
    const rows = program.reachability.filter((row) => row.callBeforeSstore.length > 0);
    const primary = rows[0];
    const hit = primary?.callBeforeSstore[0];
    if (!primary || !hit) return [];
    return [
      bytecodeCfgFinding({
        ruleId: this.id,
        title: 'External call is reachable before an SSTORE on a hook callback path',
        category: 'SWAP_SECURITY',
        severity: 'medium',
        confidence: primary.confidence === 'HIGH' ? 'MEDIUM' : 'LOW',
        ruleTier: 3,
        impact: 'CALLBACK_CALL_BEFORE_STATE',
        affectedComponent: 'swap-callbacks',
        functionName: primary.callback,
        sourceLocation: `pc:${hit.callPc}->${hit.sstorePc}`,
        description:
          'On a recovered callback path, CALL or DELEGATECALL is observed before a later SSTORE. Ordering is CFG-based, not a full EVM interpreter. This is a review signal, not a confirmed reentrancy issue.',
        evidence: {
          analysisType: BYTECODE_CFG,
          detector: CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE,
          callback: primary.callback,
          entryPc: primary.entryPc,
          opcode: 'CALL',
          pc: hit.callPc,
          sstorePc: hit.sstorePc,
          path: hit.path,
          pathLength: hit.path.length,
          executionPath: hit.path,
          callbacks: rows.map((row) => row.callback),
        },
      }),
    ];
  },
};
