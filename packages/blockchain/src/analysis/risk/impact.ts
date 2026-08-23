import type { FindingSeverity, RiskImpact } from '@hookguard/types';

export const RISK_IMPACTS: readonly RiskImpact[] = [
  'SWAP_PATH_LOGIC_REPLACEABLE',
  'PRIVILEGED_TOKEN_MOVEMENT',
  'PRIVILEGED_FEE_CHANGE',
  'PRIVILEGED_ORACLE_CHANGE',
  'CALLBACK_EXTERNAL_CALL',
  'PRIVILEGED_CONFIGURATION',
] as const;

export const IMPACT_LABELS: Record<RiskImpact, string> = {
  SWAP_PATH_LOGIC_REPLACEABLE:
    'Whoever can upgrade the implementation can replace swap-callback logic.',
  PRIVILEGED_TOKEN_MOVEMENT:
    'A privileged account may be able to invoke token-transfer functions if they are reachable.',
  PRIVILEGED_FEE_CHANGE:
    'A privileged account may be able to change swap fees while swap callbacks are enabled.',
  PRIVILEGED_ORACLE_CHANGE:
    'A privileged account may be able to change an oracle used with price-sensitive callbacks.',
  CALLBACK_EXTERNAL_CALL:
    'External CALL/DELEGATECALL exists in the same contract that implements hook callbacks.',
  PRIVILEGED_CONFIGURATION:
    'A privileged account can change hook configuration (pause, ownership, hook address).',
};

export function impactSeverity(
  impact: RiskImpact,
  eoaController: boolean,
): FindingSeverity {
  switch (impact) {
    case 'SWAP_PATH_LOGIC_REPLACEABLE':
      return eoaController ? 'critical' : 'high';
    case 'PRIVILEGED_TOKEN_MOVEMENT':
      return eoaController ? 'high' : 'medium';
    case 'PRIVILEGED_FEE_CHANGE':
    case 'PRIVILEGED_ORACLE_CHANGE':
      return eoaController ? 'high' : 'medium';
    case 'CALLBACK_EXTERNAL_CALL':
      return 'low';
    case 'PRIVILEGED_CONFIGURATION':
      return eoaController ? 'medium' : 'low';
    default:
      return 'info';
  }
}
