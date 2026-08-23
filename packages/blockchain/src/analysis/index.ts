export { runAnalysis, DEFAULT_RULES, engineRuleIds } from './engine.js';
export type {
  AnalysisInput,
  AnalysisFunction,
  AnalysisPermission,
  AnalysisProxy,
  AnalysisRule,
  EngineFinding,
} from './types.js';
export { codeIsEmpty } from './types.js';
export { scanOpcodes } from './opcodes.js';
export { proxyRules } from './rules/proxy.rules.js';
export { ownershipRules } from './rules/ownership.rules.js';
export {
  hooksRules,
  hookAddressFlags,
  HOOK_CALLBACKS,
  classifyHookPermissions,
} from './rules/hooks.rules.js';
export { externalCallRules } from './rules/external-call.rules.js';
export { permissionsRules, PRIVILEGED_FUNCTIONS } from './rules/permissions.rules.js';
export { RULE_TIERS, ruleTier } from './tiers.js';
export {
  parseValidationDataset,
  computeValidationMetrics,
  precision,
  type ValidationDataset,
  type ValidationReview,
  type ValidationMetrics,
  type RuleQualityRow,
} from './validation.js';
export { associateCallsWithSource, flattenVerifiedSource } from './source-calls.js';
export { privilegedMutators } from './privileged.js';
export { riskRules, collectCapabilityFacts } from './risk/risk-engine.js';
export {
  RISK_CATEGORIES,
  RISK_CATEGORY_LABELS,
  isRiskCategory,
  CAPABILITY_DISCLAIMER,
} from './risk/taxonomy.js';
export { RISK_IMPACTS, IMPACT_LABELS, impactSeverity } from './risk/impact.js';
export type { CapabilityFacts } from './risk/facts.js';
export type { AffectedComponent } from './risk/taxonomy.js';
