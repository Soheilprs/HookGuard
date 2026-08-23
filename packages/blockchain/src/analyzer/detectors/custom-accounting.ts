import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { analyzerFinding } from '../emit.js';
import { buildHookProgram } from '../hooks/lifecycle.js';
import { suspiciousAccounting, usesCustomAccounting } from '../hooks/patterns.js';

export const CUSTOM_ACCOUNTING_RULE_ID = 'CUSTOM_ACCOUNTING_REVIEW';

export const customAccountingDetector: AnalysisRule = {
  id: CUSTOM_ACCOUNTING_RULE_ID,
  run(input: AnalysisInput): EngineFinding[] {
    const program = buildHookProgram(input);
    const hits = program.lifecycleFunctions.filter(
      (fn) =>
        /^(beforeSwap|afterSwap)$/i.test(fn.name) &&
        suspiciousAccounting(fn.strippedBody),
    );
    if (hits.length === 0) return [];
    const primary = hits[0];
    if (!primary) return [];

    return [
      analyzerFinding({
        ruleId: this.id,
        title: 'Swap callback uses unvalidated custom accounting input',
        category: 'delta-accounting',
        severity: 'medium',
        confidence: 'MEDIUM',
        detectionSource: 'VERIFIED_SOURCE',
        ruleTier: 2,
        impact: 'CUSTOM_ACCOUNTING_UNVALIDATED',
        affectedComponent: 'swap-callbacks',
        analysisType: 'SOURCE',
        fn: primary,
        description:
          'beforeSwap/afterSwap source uses Uniswap v4 custom accounting (BeforeSwapDelta/AfterSwapDelta or hookData-derived delta) without an observed bound or validation. Custom accounting is a feature; this flags a review pattern, not a confirmed issue.',
        evidence: {
          callbacks: hits.map((fn) => fn.name),
          usesBeforeOrAfterSwapDelta: usesCustomAccounting(primary.strippedBody),
          hookDataDecode: /abi\s*\.\s*decode\s*\(\s*hookData/.test(primary.strippedBody),
        },
      }),
    ];
  },
};
