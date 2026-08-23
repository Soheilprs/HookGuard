import type { AnalysisRule } from '../types.js';
import { upgradeableSwapControlRule } from './categories/upgrade-security.js';
import { privilegedAssetMovementRule } from './categories/fund-safety.js';
import { privilegedFeeModificationRule } from './categories/swap-security.js';
import { privilegedOracleModificationRule } from './categories/oracle-security.js';
import { privilegedAdminControlRule } from './categories/admin-control.js';
import { callbackExternalExecutionRule } from './categories/external-execution.js';

export { collectCapabilityFacts, type CapabilityFacts } from './facts.js';

export const riskRules: AnalysisRule[] = [
  upgradeableSwapControlRule,
  privilegedAssetMovementRule,
  privilegedFeeModificationRule,
  privilegedOracleModificationRule,
  callbackExternalExecutionRule,
  privilegedAdminControlRule,
];
