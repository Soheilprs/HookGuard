import type { AnalysisInput, AnalysisRule, EngineFinding } from '../../types.js';
import { CAPABILITY_DISCLAIMER } from '../taxonomy.js';
import { impactSeverity } from '../impact.js';
import { collectCapabilityFacts } from '../facts.js';

export const upgradeableSwapControlRule: AnalysisRule = {
  id: 'risk-upgradeable-swap-control',
  run(input: AnalysisInput): EngineFinding[] {
    const facts = collectCapabilityFacts(input);
    const upgradePresent =
      facts.upgradeFunctions.length > 0 || facts.eoaUpgradeController;
    if (!facts.isProxy || facts.swapCallbacks.length === 0 || !upgradePresent) {
      return [];
    }

    const namedUpgrade = facts.upgradeFunctions.some((fn) => fn.name !== 'unknown');
    const confidence =
      namedUpgrade || facts.eoaUpgradeController ? 'HIGH' : facts.namedAbi ? 'MEDIUM' : 'LOW';

    return [
      {
        ruleId: this.id,
        title: 'Swap-path hook logic is upgradeable',
        category: 'UPGRADE_SECURITY',
        severity: impactSeverity('SWAP_PATH_LOGIC_REPLACEABLE', facts.eoaUpgradeController),
        confidence,
        detectionSource: facts.eoaUpgradeController ? 'EIP1967_STORAGE' : 'VERIFIED_ABI',
        ruleTier: 2,
        impact: 'SWAP_PATH_LOGIC_REPLACEABLE',
        affectedComponent: 'hook-proxy',
        description: `A proxy, swap callback(s) ${facts.swapCallbacks.join(', ')}, and an upgrade authority were observed together. Whoever controls the upgrade can replace swap-callback behavior. ${CAPABILITY_DISCLAIMER}`,
        evidence: {
          proxy: true,
          proxyKind: input.proxy.kind,
          implementationAddress: input.proxy.implementationAddress,
          adminAddress: input.proxy.adminAddress,
          swapCallbacks: facts.swapCallbacks,
          upgradeFunctions: facts.upgradeFunctions.map((fn) => ({
            name: fn.name,
            selector: fn.selector,
          })),
          eoaUpgradeController: facts.eoaUpgradeController,
        },
      },
    ];
  },
};
