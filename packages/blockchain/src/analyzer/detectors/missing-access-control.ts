import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../analysis/types.js';
import { analyzerFinding } from '../emit.js';
import { buildHookProgram, isSensitiveFunction } from '../hooks/lifecycle.js';
import { hasAccessControl } from '../hooks/patterns.js';

export const MISSING_ACCESS_CONTROL_RULE_ID = 'MISSING_ACCESS_CONTROL';

export const missingAccessControlDetector: AnalysisRule = {
  id: MISSING_ACCESS_CONTROL_RULE_ID,
  run(input: AnalysisInput): EngineFinding[] {
    const program = buildHookProgram(input);
    if (!program.source) return [];
    const unguarded = program.functions.filter(
      (fn) => isSensitiveFunction(fn.name) && !hasAccessControl(fn),
    );
    if (unguarded.length === 0) return [];
    const primary = unguarded[0];
    if (!primary) return [];

    return [
      analyzerFinding({
        ruleId: this.id,
        title: 'Sensitive hook function has no observed access-control check',
        category: 'access-control',
        severity: 'high',
        confidence: 'HIGH',
        detectionSource: 'VERIFIED_SOURCE',
        ruleTier: 2,
        impact: 'UNGUARDED_SENSITIVE_FUNCTION',
        affectedComponent: 'owner-admin',
        analysisType: 'SOURCE',
        fn: primary,
        description: `Source for ${unguarded.map((fn) => fn.name).join(', ')} does not show onlyOwner, AccessControl/role, or a msg.sender owner check. That is a missing-guard observation on a sensitive hook function, not proof the function is callable in production.`,
        evidence: {
          functions: unguarded.map((fn) => ({
            name: fn.name,
            modifiers: fn.modifiers,
            sourceLocation: fn.sourceLocation,
          })),
          requiredGuards: ['onlyOwner', 'AccessControl/onlyRole', 'msg.sender owner check'],
        },
      }),
    ];
  },
};
