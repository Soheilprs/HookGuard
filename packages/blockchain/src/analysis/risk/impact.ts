import type { FindingSeverity, RiskImpact } from '@hookguard/types';

export const RISK_IMPACTS: readonly RiskImpact[] = [
  'SWAP_PATH_LOGIC_REPLACEABLE',
  'PRIVILEGED_TOKEN_MOVEMENT',
  'PRIVILEGED_FEE_CHANGE',
  'PRIVILEGED_ORACLE_CHANGE',
  'CALLBACK_EXTERNAL_CALL',
  'PRIVILEGED_CONFIGURATION',
  'CALLBACK_REENTRANCY_WINDOW',
  'UNGUARDED_SENSITIVE_FUNCTION',
  'UNRESTRICTED_CALLBACK_TARGET',
  'DELEGATECALL_IN_CALLBACK',
  'CUSTOM_ACCOUNTING_UNVALIDATED',
  'HOOK_PERMISSION_MISMATCH',
  'CALLBACK_DELEGATE_REACHABLE',
  'CALLBACK_CALL_REACHABLE',
  'CALLBACK_STATE_MUTATION',
  'CALLBACK_CALL_BEFORE_STATE',
  'UNKNOWN_CALLBACK_TARGET',
  'TOKEN_MOVEMENT_IN_CALLBACK',
  'USER_CONTROLLED_CALLBACK_TARGET',
  'PROTOCOL_CALLBACK_DEPENDENCY',
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
  CALLBACK_REENTRANCY_WINDOW:
    'A hook callback may call out before a later state update, which is a reentrancy-window review signal.',
  UNGUARDED_SENSITIVE_FUNCTION:
    'A sensitive hook function (fee, oracle, hook, withdraw, upgrade, pause) has no observed access-control check.',
  UNRESTRICTED_CALLBACK_TARGET:
    'A hook callback performs an external call to a parameter or other unrestricted target.',
  DELEGATECALL_IN_CALLBACK:
    'delegatecall is present in a hook lifecycle function (or on a hook with those callbacks, bytecode-only).',
  CUSTOM_ACCOUNTING_UNVALIDATED:
    'Swap-path custom accounting (BeforeSwapDelta/AfterSwapDelta or hookData-derived delta) lacks an observed validation.',
  HOOK_PERMISSION_MISMATCH:
    'Hook-address permission bits do not match implemented Uniswap v4 callbacks.',
  CALLBACK_DELEGATE_REACHABLE:
    'Hook lifecycle execution can delegate behavior to another contract along a recovered control-flow path.',
  CALLBACK_CALL_REACHABLE:
    'Hook lifecycle execution can reach an external CALL along a recovered control-flow path.',
  CALLBACK_STATE_MUTATION:
    'Hook callback modifies contract state during lifecycle execution (SSTORE reachable).',
  CALLBACK_CALL_BEFORE_STATE:
    'External execution occurs before a detected state update on a recovered callback path.',
  UNKNOWN_CALLBACK_TARGET:
    'A hook callback CALL target is unknown, storage-loaded, or dynamically computed.',
  TOKEN_MOVEMENT_IN_CALLBACK:
    'A hook callback CALL uses an ERC-20 transfer/approve/permit selector.',
  USER_CONTROLLED_CALLBACK_TARGET:
    'Hook callback may execute logic against a dynamically selected target derived from calldata.',
  PROTOCOL_CALLBACK_DEPENDENCY:
    'Hook callback CALL target matches a curated known protocol address.',
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
    case 'CALLBACK_REENTRANCY_WINDOW':
      return 'medium';
    case 'UNGUARDED_SENSITIVE_FUNCTION':
      return 'high';
    case 'UNRESTRICTED_CALLBACK_TARGET':
      return 'medium';
    case 'DELEGATECALL_IN_CALLBACK':
      return 'high';
    case 'CUSTOM_ACCOUNTING_UNVALIDATED':
      return 'medium';
    case 'HOOK_PERMISSION_MISMATCH':
      return 'low';
    case 'CALLBACK_DELEGATE_REACHABLE':
      return 'medium';
    case 'CALLBACK_CALL_REACHABLE':
      return 'low';
    case 'CALLBACK_STATE_MUTATION':
      return 'low';
    case 'CALLBACK_CALL_BEFORE_STATE':
      return 'medium';
    case 'UNKNOWN_CALLBACK_TARGET':
      return 'low';
    case 'TOKEN_MOVEMENT_IN_CALLBACK':
      return 'medium';
    case 'USER_CONTROLLED_CALLBACK_TARGET':
      return 'medium';
    case 'PROTOCOL_CALLBACK_DEPENDENCY':
      return 'info';
    default:
      return 'info';
  }
}
