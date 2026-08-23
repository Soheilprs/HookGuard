import type { RiskCategory, RiskImpact } from '@hookguard/types';

export const RISK_CATEGORIES: readonly RiskCategory[] = [
  'FUND_SAFETY',
  'SWAP_SECURITY',
  'UPGRADE_SECURITY',
  'ADMIN_CONTROL',
  'ORACLE_SECURITY',
  'EXTERNAL_EXECUTION',
  'PERMISSION_SECURITY',
] as const;

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  FUND_SAFETY: 'Fund safety',
  SWAP_SECURITY: 'Swap security',
  UPGRADE_SECURITY: 'Upgrade security',
  ADMIN_CONTROL: 'Admin control',
  ORACLE_SECURITY: 'Oracle security',
  EXTERNAL_EXECUTION: 'External execution',
  PERMISSION_SECURITY: 'Permission security',
};

export type AffectedComponent =
  | 'hook-proxy'
  | 'swap-callbacks'
  | 'token-movement'
  | 'fee-controller'
  | 'oracle'
  | 'owner-admin'
  | 'hook-callbacks';

export const CAPABILITY_DISCLAIMER =
  'This records a security-relevant capability or configuration. It is not a proof of exploitability or malice.';

export function isRiskCategory(value: string): value is RiskCategory {
  return (RISK_CATEGORIES as readonly string[]).includes(value);
}

export { type RiskCategory, type RiskImpact };
