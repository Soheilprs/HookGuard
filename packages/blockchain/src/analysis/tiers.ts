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
};

export function ruleTier(ruleId: string, fallback: RuleTier = 3): RuleTier {
  return RULE_TIERS[ruleId] ?? fallback;
}
