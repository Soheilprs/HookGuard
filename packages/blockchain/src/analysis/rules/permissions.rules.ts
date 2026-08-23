import { toFunctionSelector } from 'viem';
import type { FindingSeverity } from '@hookguard/types';
import type { AnalysisInput, AnalysisRule, EngineFinding } from '../types.js';

interface PrivilegedSpec {
  name: string;
  selector: string;
  category: 'permissions' | 'fee-collection' | 'oracle' | 'upgradeability' | 'access-control';
}

function spec(name: string, signature: string, category: PrivilegedSpec['category']): PrivilegedSpec {
  return {
    name,
    selector: toFunctionSelector(signature).toLowerCase(),
    category,
  };
}

export const PRIVILEGED_FUNCTIONS: PrivilegedSpec[] = [
  spec('setFee', 'function setFee(uint24)', 'fee-collection'),
  spec('setOracle', 'function setOracle(address)', 'oracle'),
  spec('setHook', 'function setHook(address)', 'permissions'),
  spec('pause', 'function pause()', 'permissions'),
  spec('unpause', 'function unpause()', 'permissions'),
  spec('transferOwnership', 'function transferOwnership(address)', 'access-control'),
  spec('renounceOwnership', 'function renounceOwnership()', 'access-control'),
  spec('setOwner', 'function setOwner(address)', 'access-control'),
  spec('setAdmin', 'function setAdmin(address)', 'access-control'),
  spec('grantRole', 'function grantRole(bytes32,address)', 'access-control'),
  spec('revokeRole', 'function revokeRole(bytes32,address)', 'access-control'),
  spec('upgradeTo', 'function upgradeTo(address)', 'upgradeability'),
  spec('upgradeToAndCall', 'function upgradeToAndCall(address,bytes)', 'upgradeability'),
];

const NAME_ALLOWLIST = new Set(
  PRIVILEGED_FUNCTIONS.map((item) => item.name.toLowerCase()),
);

function isPrivilegedName(name: string): boolean {
  const lower = name.toLowerCase();
  if (NAME_ALLOWLIST.has(lower)) return true;
  if (/^set[A-Z]/.test(name)) return true;
  return false;
}

export const privilegedFunctionsRule: AnalysisRule = {
  id: 'privileged-functions',
  run(input: AnalysisInput): EngineFinding[] {
    const selectorSet = new Set(PRIVILEGED_FUNCTIONS.map((item) => item.selector));
    const matched = input.functions.filter((fn) => {
      if (fn.name !== 'unknown' && isPrivilegedName(fn.name)) return true;
      return selectorSet.has(fn.selector.toLowerCase());
    });
    if (matched.length === 0) return [];

    const upgrade = matched.some((fn) => fn.name.toLowerCase().startsWith('upgrade'));
    const severity: FindingSeverity = upgrade ? 'high' : 'medium';

    return [
      {
        ruleId: this.id,
        title: 'Privileged / admin setter functions present',
        category: 'permissions',
        severity,
        description:
          'ABI or known selectors include admin-style setters (fee, oracle, hook, pause, ownership, upgrade). Presence is a fact; it is not a confirmed vulnerability.',
        evidence: {
          functions: matched.map((fn) => ({
            name: fn.name,
            selector: fn.selector,
            stateMutability: fn.stateMutability,
          })),
        },
      },
    ];
  },
};

export const permissionsRules: AnalysisRule[] = [privilegedFunctionsRule];
