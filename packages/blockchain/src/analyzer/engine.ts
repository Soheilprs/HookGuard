import type { AnalysisRule } from '../analysis/types.js';
import { callbackReentrancyDetector } from './detectors/callback-reentrancy.js';
import { customAccountingDetector } from './detectors/custom-accounting.js';
import { dangerousDelegatecallDetector } from './detectors/dangerous-delegatecall.js';
import { hookPermissionMismatchDetector } from './detectors/hook-permission-mismatch.js';
import { missingAccessControlDetector } from './detectors/missing-access-control.js';
import { unrestrictedExternalExecutionDetector } from './detectors/unrestricted-external-execution.js';

export const analyzerRules: AnalysisRule[] = [
  callbackReentrancyDetector,
  missingAccessControlDetector,
  unrestrictedExternalExecutionDetector,
  dangerousDelegatecallDetector,
  customAccountingDetector,
  hookPermissionMismatchDetector,
];

export const ANALYZER_RULE_IDS = analyzerRules.map((rule) => rule.id);

export {
  CALLBACK_REENTRANCY_RULE_ID,
} from './detectors/callback-reentrancy.js';
export { CUSTOM_ACCOUNTING_RULE_ID } from './detectors/custom-accounting.js';
export { DANGEROUS_DELEGATECALL_RULE_ID } from './detectors/dangerous-delegatecall.js';
export { HOOK_PERMISSION_MISMATCH_RULE_ID } from './detectors/hook-permission-mismatch.js';
export { MISSING_ACCESS_CONTROL_RULE_ID } from './detectors/missing-access-control.js';
export { UNRESTRICTED_EXTERNAL_EXECUTION_RULE_ID } from './detectors/unrestricted-external-execution.js';
