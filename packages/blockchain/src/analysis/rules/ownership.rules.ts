import type { AnalysisInput, AnalysisRule, EngineFinding } from '../types.js';
import { codeIsEmpty } from '../types.js';
import { hasUpgradeMutator, privilegedMutators } from '../privileged.js';
import { ruleTier } from '../tiers.js';

function byType(input: AnalysisInput, type: string) {
  return input.permissions.filter(
    (permission) => permission.type.toLowerCase() === type,
  );
}

export const ownershipOwnerRule: AnalysisRule = {
  id: 'ownership-owner',
  run(input: AnalysisInput): EngineFinding[] {
    const owners = byType(input, 'owner');
    if (owners.length === 0) return [];
    return [
      {
        ruleId: this.id,
        title: 'owner() returned a non-zero address',
        category: 'access-control',
        severity: 'info',
        confidence: 'HIGH',
        detectionSource: 'ONCHAIN_CALL',
        ruleTier: ruleTier(this.id, 1),
        description:
          'An eth_call to owner() succeeded and returned a non-zero address. This is an ownership fact, not a risk score.',
        evidence: {
          owners: owners.map((owner) => ({
            address: owner.address,
            source: owner.source,
          })),
        },
      },
    ];
  },
};

export const ownershipOwnerEoaRule: AnalysisRule = {
  id: 'ownership-owner-eoa',
  run(input: AnalysisInput): EngineFinding[] {
    const eoaOwners = byType(input, 'owner').filter(
      (owner) => codeIsEmpty(input, owner.address) === true,
    );
    if (eoaOwners.length === 0) return [];
    const mutators = privilegedMutators(input.functions);
    const upgrade = hasUpgradeMutator(input.functions);
    const correlated = mutators.length > 0;
    return [
      {
        ruleId: this.id,
        title: correlated
          ? upgrade
            ? 'EOA owner correlated with upgrade function'
            : 'EOA owner correlated with privileged setters'
          : 'Owner is an EOA (no privileged mutators discovered)',
        category: 'access-control',
        severity: correlated ? (upgrade ? 'high' : 'medium') : 'info',
        confidence: correlated ? 'HIGH' : 'MEDIUM',
        detectionSource: 'ONCHAIN_CALL',
        ruleTier: ruleTier(this.id, 2),
        description: correlated
          ? 'owner() is an EOA and the ABI/functions include mutating privileged entry points. That combination is upgrade or admin authority — still not an exploit by itself.'
          : 'owner() is an EOA, but no privileged mutating functions were discovered. Recorded as a fact with lower severity.',
        evidence: {
          owners: eoaOwners.map((owner) => ({
            address: owner.address,
            source: owner.source,
            bytecodeEmpty: true,
          })),
          privilegedMutators: mutators.map((fn) => ({
            name: fn.name,
            selector: fn.selector,
          })),
          correlated,
        },
      },
    ];
  },
};

export const ownershipAccessControlRule: AnalysisRule = {
  id: 'ownership-access-control',
  run(input: AnalysisInput): EngineFinding[] {
    const admins = [
      ...byType(input, 'default_admin_role'),
      ...byType(input, 'admin'),
    ];
    if (admins.length === 0) return [];
    const fromEnumeration = admins.some((admin) =>
      admin.source.toLowerCase().includes('getrolemember'),
    );
    return [
      {
        ruleId: this.id,
        title: 'AccessControl or admin() returned role holders',
        category: 'access-control',
        severity: 'info',
        confidence: 'HIGH',
        detectionSource: fromEnumeration
          ? 'ACCESS_CONTROL_ENUMERATION'
          : 'ONCHAIN_CALL',
        ruleTier: ruleTier(this.id, 1),
        description:
          'On-chain calls enumerated DEFAULT_ADMIN_ROLE members and/or admin(). This lists holders; it is not a verdict.',
        evidence: {
          admins: admins.map((admin) => ({
            type: admin.type,
            address: admin.address,
            source: admin.source,
          })),
        },
      },
    ];
  },
};

export const ownershipDefaultAdminEoaRule: AnalysisRule = {
  id: 'ownership-default-admin-eoa',
  run(input: AnalysisInput): EngineFinding[] {
    const eoaAdmins = byType(input, 'default_admin_role').filter(
      (admin) => codeIsEmpty(input, admin.address) === true,
    );
    if (eoaAdmins.length === 0) return [];
    const mutators = privilegedMutators(input.functions);
    const correlated = mutators.length > 0;
    return [
      {
        ruleId: this.id,
        title: correlated
          ? 'DEFAULT_ADMIN_ROLE is an EOA with privileged setters'
          : 'DEFAULT_ADMIN_ROLE is an EOA (no privileged mutators discovered)',
        category: 'access-control',
        severity: correlated ? 'medium' : 'info',
        confidence: correlated ? 'HIGH' : 'MEDIUM',
        detectionSource: 'ACCESS_CONTROL_ENUMERATION',
        ruleTier: ruleTier(this.id, 2),
        description: correlated
          ? 'getRoleMember(DEFAULT_ADMIN_ROLE) is an EOA and privileged mutating functions exist.'
          : 'getRoleMember(DEFAULT_ADMIN_ROLE) is an EOA. No privileged mutators were discovered, so this stays a fact.',
        evidence: {
          admins: eoaAdmins.map((admin) => ({
            address: admin.address,
            source: admin.source,
            bytecodeEmpty: true,
          })),
          privilegedMutators: mutators.map((fn) => ({
            name: fn.name,
            selector: fn.selector,
          })),
          correlated,
        },
      },
    ];
  },
};

export const ownershipRules: AnalysisRule[] = [
  ownershipOwnerRule,
  ownershipOwnerEoaRule,
  ownershipAccessControlRule,
  ownershipDefaultAdminEoaRule,
];
