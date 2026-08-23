import { HOOK_CALLBACKS } from '../../analysis/rules/hooks.rules.js';
import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { analyzerFinding } from '../emit.js';
import {
  ANALYZER_LIFECYCLE_CALLBACKS,
  buildHookProgram,
  implementedLifecycleNames,
} from '../hooks/lifecycle.js';
import { findExternalCalls } from '../hooks/patterns.js';

export const DANGEROUS_DELEGATECALL_RULE_ID = 'DANGEROUS_DELEGATECALL';

export const dangerousDelegatecallDetector: AnalysisRule = {
  id: DANGEROUS_DELEGATECALL_RULE_ID,
  run(input: AnalysisInput): EngineFinding[] {
    const program = buildHookProgram(input);
    const sourceHits = program.lifecycleFunctions.filter((fn) =>
      findExternalCalls(fn.strippedBody).some((site) => site.kind === 'delegatecall'),
    );
    if (sourceHits.length > 0) {
      const primary = sourceHits[0];
      if (!primary) return [];
      return [
        analyzerFinding({
          ruleId: this.id,
          title: 'delegatecall observed inside a hook lifecycle function',
          category: 'external-calls',
          severity: 'high',
          confidence: 'HIGH',
          detectionSource: 'VERIFIED_SOURCE',
          ruleTier: 2,
          impact: 'DELEGATECALL_IN_CALLBACK',
          affectedComponent: 'hook-callbacks',
          analysisType: 'SOURCE',
          fn: primary,
          description:
            'Verified source places delegatecall in a listed Uniswap v4 lifecycle callback. That can execute arbitrary code in the hook’s storage context. This is not a confirmed issue.',
          evidence: {
            callbacks: sourceHits.map((fn) => fn.name),
            kind: 'delegatecall',
            reachableFromHookCallback: true,
          },
        }),
      ];
    }

    const lifecycle = implementedLifecycleNames(program);
    const flagged = program.flags.filter((name) =>
      (ANALYZER_LIFECYCLE_CALLBACKS as readonly string[]).includes(name),
    );
    const present = lifecycle.length > 0 || flagged.length > 0;
    if (!program.bytecodeDelegatecall || !present) return [];

    return [
      analyzerFinding({
        ruleId: this.id,
        title: 'DELEGATECALL opcode present on a hook with lifecycle callbacks',
        category: 'external-calls',
        severity: 'low',
        confidence: 'LOW',
        detectionSource: 'BYTECODE_OPCODE',
        ruleTier: 3,
        impact: 'DELEGATECALL_IN_CALLBACK',
        affectedComponent: 'hook-callbacks',
        analysisType: 'BYTECODE',
        functionName: flagged[0] ?? lifecycle[0] ?? HOOK_CALLBACKS[0]?.name ?? null,
        description:
          'Runtime bytecode contains DELEGATECALL and this hook has listed lifecycle callbacks. Bytecode cannot prove the opcode sits inside beforeSwap or another callback.',
        evidence: {
          opcode: 'DELEGATECALL',
          lifecycleCallbacks: [...new Set([...flagged, ...lifecycle])],
          reachableFromHookCallback: false,
        },
      }),
    ];
  },
};
