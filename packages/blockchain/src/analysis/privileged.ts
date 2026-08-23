import type { AnalysisFunction } from './types.js';

const MUTATOR_NAMES = new Set([
  'upgradeto',
  'upgradetoandcall',
  'setfee',
  'setoracle',
  'sethook',
  'pause',
  'unpause',
  'transferownership',
  'setowner',
  'setadmin',
  'grantrole',
  'revokerole',
]);

export function privilegedMutators(functions: AnalysisFunction[]): AnalysisFunction[] {
  return functions.filter((fn) => {
    const name = fn.name.toLowerCase();
    if (name === 'unknown') return false;
    if (MUTATOR_NAMES.has(name)) return true;
    if (/^set[a-z]/.test(name) && fn.stateMutability !== 'view' && fn.stateMutability !== 'pure') {
      return true;
    }
    return false;
  });
}

export function hasUpgradeMutator(functions: AnalysisFunction[]): boolean {
  return privilegedMutators(functions).some((fn) =>
    fn.name.toLowerCase().startsWith('upgrade'),
  );
}
