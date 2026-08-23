export type FindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type FindingConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type DetectionSource =
  | 'EIP1967_STORAGE'
  | 'ONCHAIN_CALL'
  | 'VERIFIED_ABI'
  | 'VERIFIED_SOURCE'
  | 'BYTECODE_SELECTOR'
  | 'BYTECODE_OPCODE'
  | 'HOOK_ADDRESS_FLAGS'
  | 'ACCESS_CONTROL_ENUMERATION';

export type ValidationStatus =
  | 'UNREVIEWED'
  | 'CONFIRMED'
  | 'FALSE_POSITIVE'
  | 'NEEDS_CONTEXT';

export type RuleTier = 1 | 2 | 3;

export type RiskCategory =
  | 'FUND_SAFETY'
  | 'SWAP_SECURITY'
  | 'UPGRADE_SECURITY'
  | 'ADMIN_CONTROL'
  | 'ORACLE_SECURITY'
  | 'EXTERNAL_EXECUTION'
  | 'PERMISSION_SECURITY';

export type RiskImpact =
  | 'SWAP_PATH_LOGIC_REPLACEABLE'
  | 'PRIVILEGED_TOKEN_MOVEMENT'
  | 'PRIVILEGED_FEE_CHANGE'
  | 'PRIVILEGED_ORACLE_CHANGE'
  | 'CALLBACK_EXTERNAL_CALL'
  | 'PRIVILEGED_CONFIGURATION'
  | 'CALLBACK_REENTRANCY_WINDOW'
  | 'UNGUARDED_SENSITIVE_FUNCTION'
  | 'UNRESTRICTED_CALLBACK_TARGET'
  | 'DELEGATECALL_IN_CALLBACK'
  | 'CUSTOM_ACCOUNTING_UNVALIDATED'
  | 'HOOK_PERMISSION_MISMATCH'
  | 'CALLBACK_DELEGATE_REACHABLE'
  | 'CALLBACK_CALL_REACHABLE'
  | 'CALLBACK_STATE_MUTATION'
  | 'CALLBACK_CALL_BEFORE_STATE';

export type FindingCategory =
  | RiskCategory
  | 'permissions'
  | 'access-control'
  | 'hook-lifecycle'
  | 'delta-accounting'
  | 'reentrancy'
  | 'oracle'
  | 'upgradeability'
  | 'fee-collection'
  | 'external-calls'
  | 'other';

export type HookPermissionClass =
  | 'MATCH'
  | 'EXTRA_IMPLEMENTED_CALLBACK'
  | 'MISSING_EXPECTED_CALLBACK'
  | 'UNKNOWN_SOURCE';

export interface FindingEvidence {
  [key: string]: unknown;
}

export interface Finding {
  id: string;
  hookId: string;
  ruleId: string;
  title: string;
  category: FindingCategory | string;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  detectionSource: DetectionSource;
  validationStatus: ValidationStatus;
  validatedAt: Date | null;
  validationNotes: string | null;
  impact: RiskImpact | string | null;
  affectedComponent: string | null;
  description: string;
  evidence: FindingEvidence;
  /** Playbook text derived at read time. Not a stored score. */
  guidance?: string | null;
  reviewQuestions?: string[];
  functionName?: string | null;
  sourceLocation?: string | null;
  codeSnippet?: string | null;
  analysisType?: string | null;
  createdAt: Date;
}
