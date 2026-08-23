import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { analyzerFinding } from '../emit.js';
import { buildHookProgram } from '../hooks/lifecycle.js';
import { findExternalCalls, isUnrestrictedTarget } from '../hooks/patterns.js';

export const UNRESTRICTED_EXTERNAL_EXECUTION_RULE_ID = 'UNRESTRICTED_EXTERNAL_EXECUTION';

export const unrestrictedExternalExecutionDetector: AnalysisRule = {
  id: UNRESTRICTED_EXTERNAL_EXECUTION_RULE_ID,
  run(input: AnalysisInput): EngineFinding[] {
    const program = buildHookProgram(input);
    const hits = program.lifecycleFunctions
      .map((fn) => {
        const calls = findExternalCalls(fn.strippedBody).filter((site) =>
          isUnrestrictedTarget(site.target, fn.params),
        );
        return calls.length > 0 ? { fn, calls } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (hits.length === 0) return [];
    const primary = hits[0];
    if (!primary) return [];

    return [
      analyzerFinding({
        ruleId: this.id,
        title: 'Hook callback performs an external call to an unrestricted target',
        category: 'external-calls',
        severity: 'medium',
        confidence: 'MEDIUM',
        detectionSource: 'VERIFIED_SOURCE',
        ruleTier: 2,
        impact: 'UNRESTRICTED_CALLBACK_TARGET',
        affectedComponent: 'hook-callbacks',
        analysisType: 'SOURCE',
        fn: primary.fn,
        description:
          'A listed lifecycle callback calls into a target that is a parameter, msg.sender, or similarly unrestricted address. A hardcoded or constant target is not this finding.',
        evidence: {
          callbacks: hits.map((hit) => hit.fn.name),
          targets: primary.calls.map((site) => ({
            kind: site.kind,
            target: site.target,
            unrestricted: true,
          })),
        },
      }),
    ];
  },
};
