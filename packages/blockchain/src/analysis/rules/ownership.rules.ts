import type { AnalysisInput, AnalysisRule, EngineFinding } from '../types.js';
import { codeIsEmpty } from '../types.js';

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
        title: 'Ownable owner() is set',
        category: 'access-control',
        severity: 'info',
        description:
          'The contract (or its implementation) returned a non-zero owner() address.',
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
    return [
      {
        ruleId: this.id,
        title: 'Owner is an EOA',
        category: 'access-control',
        severity: 'medium',
        description:
          'owner() resolves to an address with empty bytecode, so a single key can call privileged functions.',
        evidence: {
          owners: eoaOwners.map((owner) => ({
            address: owner.address,
            source: owner.source,
            bytecodeEmpty: true,
          })),
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
    return [
      {
        ruleId: this.id,
        title: 'AccessControl / admin role observed',
        category: 'access-control',
        severity: 'info',
        description:
          'The contract exposed AccessControl DEFAULT_ADMIN_ROLE members and/or admin().',
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
    return [
      {
        ruleId: this.id,
        title: 'DEFAULT_ADMIN_ROLE is held by an EOA',
        category: 'access-control',
        severity: 'medium',
        description:
          'getRoleMember(DEFAULT_ADMIN_ROLE) returned an address with empty bytecode.',
        evidence: {
          admins: eoaAdmins.map((admin) => ({
            address: admin.address,
            source: admin.source,
            bytecodeEmpty: true,
          })),
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
