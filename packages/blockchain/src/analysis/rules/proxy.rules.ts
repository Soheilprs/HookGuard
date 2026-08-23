import type { AnalysisInput, AnalysisRule, EngineFinding } from '../types.js';
import { codeIsEmpty } from '../types.js';

export const proxyUsedRule: AnalysisRule = {
  id: 'proxy-used',
  run(input: AnalysisInput): EngineFinding[] {
    if (!input.proxy.isProxy) return [];
    return [
      {
        ruleId: this.id,
        title: 'Hook is deployed behind a proxy',
        category: 'upgradeability',
        severity: 'info',
        description:
          'Storage-slot inspection shows this hook address is a proxy. Logic may live at the implementation address.',
        evidence: {
          kind: input.proxy.kind,
          implementationAddress: input.proxy.implementationAddress,
          adminAddress: input.proxy.adminAddress,
          slot: 'eip1967.proxy.implementation',
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
        title: 'Proxy admin address is set',
        category: 'upgradeability',
        severity: 'medium',
        description:
          'The EIP-1967 admin slot is non-zero. That address can typically change the implementation.',
        evidence: {
          adminAddress: input.proxy.adminAddress,
          kind: input.proxy.kind,
          slot: 'eip1967.proxy.admin',
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
        title: 'Proxy admin is an EOA',
        category: 'upgradeability',
        severity: 'high',
        description:
          'The proxy admin address has empty bytecode, so it is an externally owned account. That account can upgrade the hook.',
        evidence: {
          adminAddress: admin,
          bytecodeEmpty: true,
          kind: input.proxy.kind,
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
    if (!input.proxy.isProxy && upgradeFns.length === 0) return [];
    if (upgradeFns.length === 0 && input.proxy.kind !== 'uups') return [];

    return [
      {
        ruleId: this.id,
        title: 'Upgrade authority observed',
        category: 'upgradeability',
        severity: 'medium',
        description:
          'The hook exposes upgrade entry points and/or is a UUPS proxy, so implementation code can change.',
        evidence: {
          kind: input.proxy.kind,
          implementationAddress: input.proxy.implementationAddress,
          functions: upgradeFns.map((fn) => ({
            name: fn.name,
            selector: fn.selector,
          })),
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
