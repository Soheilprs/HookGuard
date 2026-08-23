import type { RuleTier } from '@hookguard/types';

/** Published rule quality. Tier 3 is heuristic and must look different in the UI. */
export const RULE_TIERS: Record<string, RuleTier> = {
  'proxy-used': 1,
  'proxy-admin': 1,
  'proxy-admin-eoa': 1,
  'ownership-owner': 1,
  'ownership-access-control': 1,
  'hooks-address-flags': 1,
  'hooks-permission-compare': 1,
  'proxy-upgrade-authority': 2,
  'ownership-owner-eoa': 2,
  'ownership-default-admin-eoa': 2,
  'privileged-functions': 2,
  'hooks-lifecycle': 2,
  'ext-call': 3,
  'ext-delegatecall': 3,
  'ext-staticcall': 3,
  'risk-upgradeable-swap-control': 2,
  'risk-privileged-asset-movement': 2,
  'risk-privileged-fee-modification': 2,
  'risk-privileged-oracle-modification': 2,
  'risk-privileged-admin-control': 2,
  'risk-callback-external-execution': 3,
  CALLBACK_REENTRANCY_RISK: 2,
  MISSING_ACCESS_CONTROL: 2,
  UNRESTRICTED_EXTERNAL_EXECUTION: 2,
  DANGEROUS_DELEGATECALL: 2,
  CUSTOM_ACCOUNTING_REVIEW: 2,
  HOOK_PERMISSION_MISMATCH: 2,
  CALLBACK_REACHABLE_DELEGATECALL: 2,
  CALLBACK_EXTERNAL_CALL: 2,
  CALLBACK_STORAGE_MUTATION: 2,
  CALLBACK_EXTERNAL_CALL_BEFORE_STORAGE_UPDATE: 3,
  UNKNOWN_EXTERNAL_TARGET: 2,
  TOKEN_MOVEMENT_IN_CALLBACK: 2,
  USER_CONTROLLED_EXTERNAL_EXECUTION: 2,
  PROTOCOL_INTERACTION: 2,
};

export function ruleTier(ruleId: string, fallback: RuleTier = 3): RuleTier {
  return RULE_TIERS[ruleId] ?? fallback;
}
