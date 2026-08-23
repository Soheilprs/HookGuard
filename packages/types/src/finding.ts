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

export type FindingCategory =
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
  description: string;
  evidence: FindingEvidence;
  createdAt: Date;
}
