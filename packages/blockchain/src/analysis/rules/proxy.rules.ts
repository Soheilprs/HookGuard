import type { AnalysisInput, AnalysisRule, EngineFinding } from '../types.js';
import { codeIsEmpty } from '../types.js';
import { hasUpgradeMutator } from '../privileged.js';
import { ruleTier } from '../tiers.js';

export const proxyUsedRule: AnalysisRule = {
  id: 'proxy-used',
  run(input: AnalysisInput): EngineFinding[] {
    if (!input.proxy.isProxy) return [];
    const implEmpty = codeIsEmpty(input, input.proxy.implementationAddress);
    const adminEmpty = codeIsEmpty(input, input.proxy.adminAddress);
    return [
      {
        ruleId: this.id,
        title: 'EIP-1967 implementation slot is set',
        category: 'upgradeability',
        severity: 'info',
        confidence: implEmpty === false ? 'HIGH' : 'MEDIUM',
        detectionSource: 'EIP1967_STORAGE',
        ruleTier: ruleTier(this.id, 1),
        description:
          'The EIP-1967 implementation storage slot is non-zero. This records proxy storage, not a vulnerability. UUPS is not assumed from the slot alone.',
        evidence: {
          implementationSlot: 'eip1967.proxy.implementation',
          implementationAddress: input.proxy.implementationAddress,
          implementationBytecodeEmpty: implEmpty ?? null,
          adminSlot: 'eip1967.proxy.admin',
          adminAddress: input.proxy.adminAddress,
          adminBytecodeEmpty: adminEmpty ?? null,
          classifiedKind: input.proxy.kind,
          kindReason:
            input.proxy.kind === 'uups'
              ? 'upgrade selector present and admin slot empty'
              : input.proxy.kind === 'transparent'
                ? 'admin slot non-zero'
                : 'implementation slot only',
        },
      },
    ];
  },
};

export const proxyAdminRule: AnalysisRule = {
  id: 'proxy-admin',
  run(input: AnalysisInput): EngineFinding[] {
    if (!input.proxy.isProxy || !input.proxy.adminAddress) return [];
    return [
      {
        ruleId: this.id,
        title: 'EIP-1967 admin slot is set',
        category: 'upgradeability',
        severity: 'info',
        confidence: 'HIGH',
        detectionSource: 'EIP1967_STORAGE',
        ruleTier: ruleTier(this.id, 1),
        description:
          'The EIP-1967 admin storage slot holds a non-zero address. That address is the recorded proxy admin.',
        evidence: {
          adminSlot: 'eip1967.proxy.admin',
          adminAddress: input.proxy.adminAddress,
          adminBytecodeEmpty: codeIsEmpty(input, input.proxy.adminAddress) ?? null,
          implementationAddress: input.proxy.implementationAddress,
        },
      },
    ];
  },
};

export const proxyAdminEoaRule: AnalysisRule = {
  id: 'proxy-admin-eoa',
  run(input: AnalysisInput): EngineFinding[] {
    const admin = input.proxy.adminAddress;
    if (!input.proxy.isProxy || !admin) return [];
    if (codeIsEmpty(input, admin) !== true) return [];
    return [
      {
        ruleId: this.id,
        title: 'Proxy admin slot points to an EOA',
        category: 'upgradeability',
        severity: 'high',
        confidence: 'HIGH',
        detectionSource: 'EIP1967_STORAGE',
        ruleTier: ruleTier(this.id, 1),
        description:
          'The EIP-1967 admin address has empty bytecode, so it is an EOA. For a transparent proxy this account can change the implementation.',
        evidence: {
          adminSlot: 'eip1967.proxy.admin',
          adminAddress: admin,
          adminBytecodeEmpty: true,
          implementationAddress: input.proxy.implementationAddress,
          implementationBytecodeEmpty:
            codeIsEmpty(input, input.proxy.implementationAddress) ?? null,
        },
      },
    ];
  },
};

const UPGRADE_NAMES = new Set([
  'upgradeto',
  'upgradetoandcall',
  'upgrade',
  'setimplementation',
]);

export const proxyUpgradeAuthorityRule: AnalysisRule = {
  id: 'proxy-upgrade-authority',
  run(input: AnalysisInput): EngineFinding[] {
    const upgradeFns = input.functions.filter((fn) =>
      UPGRADE_NAMES.has(fn.name.toLowerCase()),
    );
    if (upgradeFns.length === 0) return [];
    const named = upgradeFns.some((fn) => fn.name !== 'unknown');
    return [
      {
        ruleId: this.id,
        title: 'Upgrade function is present',
        category: 'upgradeability',
        severity: 'medium',
        confidence: named ? 'HIGH' : 'LOW',
        detectionSource: named ? 'VERIFIED_ABI' : 'BYTECODE_SELECTOR',
        ruleTier: named ? 2 : 3,
        description:
          'An upgrade entry point was found on the hook or implementation ABI/selectors. Combined with an EOA owner or EOA admin this is upgrade authority; the function alone is not an exploit.',
        evidence: {
          functions: upgradeFns.map((fn) => ({
            name: fn.name,
            selector: fn.selector,
          })),
          hasEoaAdmin: codeIsEmpty(input, input.proxy.adminAddress) === true,
          hasUpgradeMutator: hasUpgradeMutator(input.functions),
        },
      },
    ];
  },
};

export const proxyRules: AnalysisRule[] = [
  proxyUsedRule,
  proxyAdminRule,
  proxyAdminEoaRule,
  proxyUpgradeAuthorityRule,
];
