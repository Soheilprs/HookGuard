export type FindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

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
  description: string;
  evidence: FindingEvidence;
  createdAt: Date;
}
