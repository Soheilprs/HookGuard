import { toFunctionSelector } from 'viem';
import { associateCallsWithSource } from '../source-calls.js';
import { scanOpcodes } from '../opcodes.js';
import { PRIVILEGED_FUNCTIONS } from '../rules/permissions.rules.js';
import { HOOK_CALLBACKS, hookAddressFlags } from '../rules/hooks.rules.js';
import { hasUpgradeMutator, privilegedMutators } from '../privileged.js';
import { codeIsEmpty, type AnalysisFunction, type AnalysisInput } from '../types.js';

const SWAP_CALLBACKS = new Set(['beforeswap', 'afterswap']);
const PRICE_CALLBACKS = new Set(['beforeswap', 'afterswap']);

const TRANSFER_SELECTORS = new Set(
  [
    'function transfer(address,uint256)',
    'function transferFrom(address,address,uint256)',
    'function safeTransfer(address,uint256)',
    'function safeTransferFrom(address,address,uint256)',
  ].map((signature) => toFunctionSelector(signature).toLowerCase()),
);

const TRANSFER_NAMES = new Set([
  'transfer',
  'transferfrom',
  'safetransfer',
  'safetransferfrom',
]);

const CONTROL_TYPES = new Set(['owner', 'admin', 'default_admin_role', 'proxy_admin']);

const FEE_SELECTORS = new Set(
  PRIVILEGED_FUNCTIONS.filter((item) => item.category === 'fee-collection').map(
    (item) => item.selector,
  ),
);
const ORACLE_SELECTORS = new Set(
  PRIVILEGED_FUNCTIONS.filter((item) => item.category === 'oracle').map((item) => item.selector),
);
const UPGRADE_SELECTORS = new Set(
  PRIVILEGED_FUNCTIONS.filter((item) => item.category === 'upgradeability').map(
    (item) => item.selector,
  ),
);

export interface CapabilityFacts {
  isProxy: boolean;
  swapCallbacks: string[];
  lifecycleCallbacks: string[];
  priceSensitiveCallbacks: string[];
  upgradeFunctions: AnalysisFunction[];
  eoaUpgradeController: boolean;
  privilegedControl: boolean;
  eoaController: boolean;
  controllers: Array<{ type: string; address: string; source: string }>;
  feeSetters: AnalysisFunction[];
  oracleSetters: AnalysisFunction[];
  tokenMovers: AnalysisFunction[];
  adminMutators: AnalysisFunction[];
  callPresent: boolean;
  delegatecallPresent: boolean;
  sourceLifecycleCalls: string[];
  namedAbi: boolean;
}

export function collectCapabilityFacts(input: AnalysisInput): CapabilityFacts {
  const flagNames = hookAddressFlags(input.hookAddress);
  const fnNames = input.functions.map((fn) => fn.name.toLowerCase());
  const selectors = new Set(input.functions.map((fn) => fn.selector.toLowerCase()));

  const lifecycleCallbacks = HOOK_CALLBACKS.filter((spec) => {
    if (flagNames.includes(spec.name)) return true;
    if (fnNames.includes(spec.name.toLowerCase())) return true;
    if (spec.aliases.some((alias) => fnNames.includes(alias.toLowerCase()))) return true;
    if (selectors.has(toFunctionSelector(spec.signature).toLowerCase())) return true;
    return false;
  }).map((spec) => spec.name);

  const swapCallbacks = lifecycleCallbacks.filter((name) =>
    SWAP_CALLBACKS.has(name.toLowerCase()),
  );
  const priceSensitiveCallbacks = lifecycleCallbacks.filter((name) =>
    PRICE_CALLBACKS.has(name.toLowerCase()),
  );

  const upgradeFunctions = input.functions.filter((fn) => {
    const name = fn.name.toLowerCase();
    if (name.startsWith('upgrade')) return true;
    return UPGRADE_SELECTORS.has(fn.selector.toLowerCase());
  });

  const controllers = input.permissions.filter((permission) =>
    CONTROL_TYPES.has(permission.type.toLowerCase()),
  );
  const eoaController = controllers.some(
    (controller) => codeIsEmpty(input, controller.address) === true,
  );
  const adminEoa =
    input.proxy.isProxy && codeIsEmpty(input, input.proxy.adminAddress) === true;
  const eoaUpgradeController =
    adminEoa ||
    (eoaController && (hasUpgradeMutator(input.functions) || upgradeFunctions.length > 0));

  const feeSetters = input.functions.filter((fn) => {
    if (fn.name.toLowerCase() === 'setfee') return true;
    return FEE_SELECTORS.has(fn.selector.toLowerCase());
  });
  const oracleSetters = input.functions.filter((fn) => {
    if (fn.name.toLowerCase() === 'setoracle') return true;
    return ORACLE_SELECTORS.has(fn.selector.toLowerCase());
  });
  const tokenMovers = input.functions.filter((fn) => {
    if (TRANSFER_NAMES.has(fn.name.toLowerCase())) return true;
    return TRANSFER_SELECTORS.has(fn.selector.toLowerCase());
  });
  const adminMutators = privilegedMutators(input.functions).filter((fn) => {
    const name = fn.name.toLowerCase();
    if (name.startsWith('upgrade')) return false;
    if (name === 'setfee' || name === 'setoracle') return false;
    return true;
  });

  const callHits = scanOpcodes(input.bytecode, [0xf1, 0xf4]);
  const sourceHits = input.sourceCode
    ? associateCallsWithSource(input.sourceCode).filter((hit) => hit.lifecycle)
    : [];

  return {
    isProxy: input.proxy.isProxy,
    swapCallbacks,
    lifecycleCallbacks,
    priceSensitiveCallbacks,
    upgradeFunctions,
    eoaUpgradeController,
    privilegedControl: controllers.length > 0,
    eoaController: eoaController || adminEoa,
    controllers,
    feeSetters,
    oracleSetters,
    tokenMovers,
    adminMutators,
    callPresent: (callHits.find((hit) => hit.opcode === 0xf1)?.pcs.length ?? 0) > 0,
    delegatecallPresent: (callHits.find((hit) => hit.opcode === 0xf4)?.pcs.length ?? 0) > 0,
    sourceLifecycleCalls: sourceHits.map((hit) => hit.functionName),
    namedAbi: input.functions.some((fn) => fn.name !== 'unknown'),
  };
}
