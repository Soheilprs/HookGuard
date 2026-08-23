import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { analyzerFinding } from '../emit.js';
import { allImplementedCallbacks, buildHookProgram } from '../hooks/lifecycle.js';

export const HOOK_PERMISSION_MISMATCH_RULE_ID = 'HOOK_PERMISSION_MISMATCH';

export const hookPermissionMismatchDetector: AnalysisRule = {
  id: HOOK_PERMISSION_MISMATCH_RULE_ID,
  run(input: AnalysisInput): EngineFinding[] {
    const program = buildHookProgram(input);
    const implemented = allImplementedCallbacks(program);
    if (implemented.length === 0 && program.flags.length === 0) return [];
    if (!program.source && program.namedFunctionNames.length === 0) return [];

    const flagSet = new Set(program.flags);
    const implSet = new Set(implemented);
    const extraImplemented = implemented.filter((name) => !flagSet.has(name));
    const missingExpected = program.flags.filter((name) => !implSet.has(name));
    if (extraImplemented.length === 0 && missingExpected.length === 0) return [];

    const fromSource = program.functions.length > 0;
    const primary = program.functions.find((fn) => extraImplemented.includes(fn.name));

    return [
      analyzerFinding({
        ruleId: this.id,
        title:
          extraImplemented.length > 0
            ? 'Implemented hook callback is not enabled on the hook address'
            : 'Hook address flag has no matching implemented callback',
        category: 'permissions',
        severity: missingExpected.length > 0 ? 'low' : 'info',
        confidence: fromSource ? 'HIGH' : 'MEDIUM',
        detectionSource: fromSource ? 'VERIFIED_SOURCE' : 'HOOK_ADDRESS_FLAGS',
        ruleTier: fromSource ? 2 : 2,
        impact: 'HOOK_PERMISSION_MISMATCH',
        affectedComponent: 'hook-callbacks',
        analysisType: fromSource ? 'SOURCE' : 'HYBRID',
        fn: primary,
        functionName: primary?.name ?? extraImplemented[0] ?? missingExpected[0] ?? null,
        description:
          extraImplemented.length > 0
            ? 'Source/ABI implements a Uniswap v4 callback whose permission bit is not set on the hook address. PoolManager will not invoke that function. This is a configuration mismatch, not automatically an issue.'
            : 'A permission bit is set on the hook address but the matching callback was not found in source/ABI. Review the implementation.',
        evidence: {
          flagsSet: program.flags,
          callbacksFound: implemented,
          extraImplemented,
          missingExpected,
          sourceVerified: program.sourceVerified,
        },
      }),
    ];
  },
};
