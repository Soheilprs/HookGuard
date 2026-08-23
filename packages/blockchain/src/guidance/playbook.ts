import type { RiskCategory, RiskImpact } from '@hookguard/types';
import { IMPACT_LABELS } from '../analysis/risk/impact.js';
import { RISK_CATEGORIES } from '../analysis/risk/taxonomy.js';

export const GUIDANCE_DISCLAIMER =
  'This is review guidance for a recorded capability or configuration. It is not a confirmed issue, not an accusation, and not a substitute for a professional smart-contract audit.';

export interface PlaybookCategory {
  category: RiskCategory;
  detects: string;
  whyItMatters: string;
  evidenceExamples: string[];
  reviewSteps: string[];
  limitations: string;
  guidance: string;
  reviewQuestions: string[];
}

export interface FindingGuidanceFields {
  guidance: string;
  reviewQuestions: string[];
  impactExplanation: string | null;
}

export const PLAYBOOK: Record<RiskCategory, PlaybookCategory> = {
  FUND_SAFETY: {
    category: 'FUND_SAFETY',
    detects:
      'Privileged control (owner, admin, role, or proxy admin) together with token-transfer capability (`transfer` / `transferFrom` / safe variants by name or canonical selector).',
    whyItMatters:
      'If those functions are reachable, an authorized account may move tokens the hook can touch. That is a fund-safety configuration, not proof that funds moved.',
    evidenceExamples: [
      'tokenMovers: name and/or selector (`0xa9059cbb`, `0x23b872dd`, …)',
      'controllers: type, address, source (`owner()`, role, proxy admin)',
      'eoaController: whether a controller has empty bytecode',
    ],
    reviewSteps: [
      'Confirm the mover selectors against the bytecode or verified ABI.',
      'Identify the controller address and whether it is an EOA, multisig, or timelock.',
      'Ask whether the hook is expected to hold or move tokens.',
      'Do not treat selector presence as a control-flow proof of reachability.',
    ],
    limitations:
      'Selector presence is not a CFG proof. Unnamed selectors stay low confidence. This finding does not say that tokens were transferred.',
    guidance:
      'Privileged control was observed together with token-transfer functions or selectors. Review who the controller is and whether those movers are reachable. This is a capability, not proof that assets moved. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Does the evidence list real transfer/transferFrom selectors or names?',
      'Who is the owner/admin, and is that account an EOA, multisig, or timelock?',
      'Is this hook expected to custody or move tokens?',
      'Is reachability from a hook callback proven, or only selector presence?',
    ],
  },
  SWAP_SECURITY: {
    category: 'SWAP_SECURITY',
    detects:
      '`beforeSwap` and/or `afterSwap` together with a fee setter (`setFee` or a known fee-collection selector) and privileged control.',
    whyItMatters:
      'An authorized party may change swap fees while the hook still runs on the swap path. Trading economics can change after LPs join.',
    evidenceExamples: [
      'swapCallbacks: beforeSwap / afterSwap',
      'feeSetters: name and selector',
      'controllers and eoaController',
    ],
    reviewSteps: [
      'Confirm the fee setter is named or matches a known selector — not an arbitrary PUSH4.',
      'Confirm a swap callback is actually encoded or implemented.',
      'Review who can call the setter and whether a timelock applies.',
      'Absence of this finding does not mean fees cannot change some other way.',
    ],
    limitations:
      'Unverified bytecode without the known `setFee` selector will not fire. Upgradeability of swap logic is a different category (`UPGRADE_SECURITY`).',
    guidance:
      'A swap callback, a fee setter, and privileged control were observed together. An authorized account may change swap fees. Confirm the setter and who controls it. This is not proof that fees were changed. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Which swap callbacks are present in the evidence?',
      'Is the fee setter named in ABI, or only a known selector?',
      'Who can call the setter, and is that path time-locked?',
      'Would a fee change surprise LPs who already provided liquidity?',
    ],
  },
  UPGRADE_SECURITY: {
    category: 'UPGRADE_SECURITY',
    detects:
      'A proxy (typically EIP-1967) together with a swap callback and an upgrade authority (upgrade function and/or EOA proxy admin).',
    whyItMatters:
      'Whoever can upgrade the implementation can replace swap-callback behavior after pools are live. LPs are not guaranteed the bytecode they first inspected.',
    evidenceExamples: [
      'proxy / proxyKind (eip-1967, …)',
      'implementationAddress and adminAddress',
      'swapCallbacks',
      'upgradeFunctions (name or selector such as `0x3659cfe6`)',
      'eoaUpgradeController',
    ],
    reviewSteps: [
      'Verify the implementation slot on-chain matches the evidence.',
      'Identify the upgrade admin and whether it is an EOA.',
      'Confirm a swap callback is actually flagged or implemented.',
      'Treat upgradeability alone, without swap-path control, as a different (weaker) observation.',
    ],
    limitations:
      'A proxy is not by itself a problem. Missing any of the three facts means this category does not fire. An upgrade function selector is not proof an upgrade occurred.',
    guidance:
      'A proxy, a swap callback, and an upgrade authority were observed together. Privileged upgrade can replace swap-path logic. Verify the implementation slot and who can call upgrade. This is not proof that an upgrade happened. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Does the EIP-1967 (or equivalent) slot still match the evidence?',
      'Who can call upgrade, and is that account an EOA?',
      'Which swap callbacks would a new implementation inherit permission to run?',
      'Is there a timelock, multisig, or immutable implementation instead?',
    ],
  },
  ADMIN_CONTROL: {
    category: 'ADMIN_CONTROL',
    detects:
      'Owner/admin together with named configuration mutators (pause, ownership transfer, hook-address setters, and similar). `owner()` alone is not enough.',
    whyItMatters:
      'Authorized accounts may change hook configuration after deployment. That is operational control, not automatically a critical issue.',
    evidenceExamples: [
      'controllers: type, address, source',
      'adminMutators: named functions such as pause or transferOwnership',
      'eoaController',
    ],
    reviewSteps: [
      'List the named mutators in the evidence — unnamed selectors are not this finding.',
      'Identify the controller and its operational controls (multisig, timelock).',
      'Separate this from fee, oracle, and upgrade categories, which have their own ANDs.',
    ],
    limitations:
      'An EOA owner with no discovered mutators is an observation fact, not this taxonomy finding. Named mutators are rare without verified ABI.',
    guidance:
      'Privileged control was observed together with named configuration mutators. Review what those functions change and who can call them. Owner presence alone is not this finding. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Which named mutators appear in the evidence?',
      'Who is the owner/admin, and is it an EOA?',
      'Do those mutators change pause, ownership, or the hooked address?',
      'Is there a documented operations process for using them?',
    ],
  },
  ORACLE_SECURITY: {
    category: 'ORACLE_SECURITY',
    detects:
      'An oracle setter (`setOracle` or a known oracle selector) together with privileged control and a price-sensitive callback (`beforeSwap` / `afterSwap`).',
    whyItMatters:
      'Price-related hook behavior can change if an authorized account points the hook at a different oracle, without changing the hook address.',
    evidenceExamples: [
      'oracleSetters: name and selector',
      'priceSensitiveCallbacks',
      'controllers and eoaController',
    ],
    reviewSteps: [
      'Confirm the setter is `setOracle` or a known oracle selector.',
      'Confirm swap-path callbacks are actually present.',
      'Review oracle trust assumptions (who can change it, what it returns).',
      'Do not treat an off-chain price feed used only by a UI as this finding.',
    ],
    limitations:
      'Without verified source or the known selector, the rule does not fire. HookGuard does not simulate oracle manipulation.',
    guidance:
      'An oracle setter, privileged control, and a price-sensitive callback were observed together. Review who can change the oracle. This is not proof that prices were manipulated. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Is the oracle setter named or a known selector?',
      'Which price-sensitive callbacks are in the evidence?',
      'Who can call the setter, and is that path restricted?',
      'What would a different oracle address change on the swap path?',
    ],
  },
  EXTERNAL_EXECUTION: {
    category: 'EXTERNAL_EXECUTION',
    detects:
      'At least one lifecycle callback together with `CALL` and/or `DELEGATECALL` in runtime bytecode, or verified source that binds those calls to a callback.',
    whyItMatters:
      'The hook can perform external contract interactions. That is common on Uniswap v4 and also how callback-time token, router, or oracle calls happen.',
    evidenceExamples: [
      'lifecycleCallbacks',
      'callPresent / delegatecallPresent',
      'sourceLifecycleCalls (empty unless verified source binds the call)',
      'reachableFromHookCallback (true only with source binding)',
    ],
    reviewSteps: [
      'Read `reachableFromHookCallback`. If false, do not describe this as “external call in beforeSwap”.',
      'Note whether CALL, DELEGATECALL, or both are present.',
      'Prefer verified source before treating opcode presence as swap-path behavior.',
      'Expect this category to be common; prevalence is not an incident count.',
    ],
    limitations:
      'Opcode presence is not a control-flow graph. Without verified source, HookGuard does not claim the call sits on `beforeSwap` or `afterSwap`.',
    guidance:
      'Lifecycle callbacks and CALL/DELEGATECALL were observed together. If `reachableFromHookCallback` is false, this is opcode presence plus callbacks, not a proven swap-path call. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Is `reachableFromHookCallback` true, or only opcode presence?',
      'Which lifecycle callbacks are listed?',
      'Is DELEGATECALL present (higher review priority than CALL)?',
      'Is verified source available to bind the call to a function?',
    ],
  },
  PERMISSION_SECURITY: {
    category: 'PERMISSION_SECURITY',
    detects:
      'Reserved for hook-address permission bits compared with recovered callbacks. Extra implemented callbacks are not auto-issues: PoolManager will not call an un-flagged callback.',
    whyItMatters:
      'The low 14 bits of the hook address are the permission model LPs actually get. Mismatches are a configuration signal, not a default “vulnerability.”',
    evidenceExamples: [
      'Observation rule `hooks-permission-compare` (often UNKNOWN_SOURCE without ABI)',
      'hook-address flags from `hooks-address-flags`',
    ],
    reviewSteps: [
      'Compare address flags with any recovered ABI callbacks.',
      'Do not treat EXTRA implemented-but-unflagged callbacks as PoolManager-invoked.',
      'Treat UNKNOWN_SOURCE as incomplete naming, not a mismatch verdict.',
    ],
    limitations:
      'This taxonomy category is not emitted as a stand-alone “vuln.” Observation rules still run. Unverified bytecode cannot classify MATCH vs EXTRA.',
    guidance:
      'Permission bits live in the hook address. Extra unflagged callbacks are not automatically invoked by PoolManager. Read flag and compare evidence; this is not a default issue. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Which permission bits are set on the hook address?',
      'Was source/ABI available to compare implemented callbacks?',
      'If a callback is implemented but unflagged, do you understand PoolManager will not call it?',
    ],
  },
};

const OBSERVATION_CATEGORY_TO_PLAYBOOK: Record<string, RiskCategory> = {
  upgradeability: 'UPGRADE_SECURITY',
  'access-control': 'ADMIN_CONTROL',
  'external-calls': 'EXTERNAL_EXECUTION',
  oracle: 'ORACLE_SECURITY',
  'fee-collection': 'SWAP_SECURITY',
  permissions: 'PERMISSION_SECURITY',
  'hook-lifecycle': 'SWAP_SECURITY',
  reentrancy: 'EXTERNAL_EXECUTION',
  'delta-accounting': 'SWAP_SECURITY',
};

const GENERIC_GUIDANCE =
  'Read the stored evidence JSON. This is an observation about a security-relevant configuration, not a confirmed issue. HookGuard does not replace a professional smart-contract audit.';

const GENERIC_QUESTIONS = [
  'Does the evidence JSON match what you see on-chain?',
  'Is this a named ABI fact, a successful eth_call, or a bytecode heuristic?',
  'Would a professional review treat this as context rather than a confirmed issue?',
];

export function playbookForCategory(category: string): PlaybookCategory | null {
  if ((RISK_CATEGORIES as readonly string[]).includes(category)) {
    return PLAYBOOK[category as RiskCategory];
  }
  const mapped = OBSERVATION_CATEGORY_TO_PLAYBOOK[category];
  return mapped ? PLAYBOOK[mapped] : null;
}

export function impactExplanationFor(impact: string | null | undefined): string | null {
  if (!impact) return null;
  if (impact in IMPACT_LABELS) {
    return `${IMPACT_LABELS[impact as RiskImpact]} ${GUIDANCE_DISCLAIMER}`;
  }
  return `Recorded impact: ${impact}. ${GUIDANCE_DISCLAIMER}`;
}

const ANALYZER_GUIDANCE: Record<string, { guidance: string; reviewQuestions: string[] }> = {
  CALLBACK_REENTRANCY_RISK: {
    guidance:
      'A listed hook callback contains an external CALL and a later state update. Review CEI ordering. This is not a confirmed issue. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Is the external call inside beforeSwap/afterSwap or a liquidity callback?',
      'Does a state write occur after that call?',
      'Would a reentrant caller observe stale hook storage?',
    ],
  },
  MISSING_ACCESS_CONTROL: {
    guidance:
      'A sensitive hook function (setFee, setOracle, setHook, withdraw, rescueTokens, upgradeTo, pause) has no observed onlyOwner, role, or msg.sender check. Confirm who can call it. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Which sensitive functions lack a guard in source?',
      'Is there a modifier the parser missed (custom name)?',
      'Should this function be onlyOwner, a role, or removed?',
    ],
  },
  UNRESTRICTED_EXTERNAL_EXECUTION: {
    guidance:
      'A hook callback calls a target that is a parameter or similarly unrestricted. A constant router is not this finding. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Is the call target `sender`, hookData-decoded, or another parameter?',
      'Would a swap caller control that address?',
      'Is the target a constant/immutable instead?',
    ],
  },
  DANGEROUS_DELEGATECALL: {
    guidance:
      'delegatecall in a hook lifecycle function runs arbitrary code against hook storage. Bytecode-only hits are not proven to sit in the callback. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Is delegatecall source-bound to a listed callback?',
      'Who controls the target?',
      'If this is bytecode-only, can verified source rule it out?',
    ],
  },
  CUSTOM_ACCOUNTING_REVIEW: {
    guidance:
      'Swap-path custom accounting appears to use hookData or another unvalidated input. Custom accounting is a Uniswap v4 feature; this is a review signal. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Is BeforeSwapDelta/AfterSwapDelta derived from hookData?',
      'Is the delta bounded or zero when unused?',
      'Can a swap caller influence token accounting?',
    ],
  },
  HOOK_PERMISSION_MISMATCH: {
    guidance:
      'Hook-address permission bits do not match implemented callbacks. Extra unflagged functions are not called by PoolManager. HookGuard does not replace a professional smart-contract audit.',
    reviewQuestions: [
      'Which flags are set vs which callbacks exist in source?',
      'Is an extra callback intentionally unimplemented at the flag layer?',
      'Is a flagged callback missing from this implementation?',
    ],
  },
};

export function findingGuidanceFor(input: {
  category: string;
  impact?: string | null;
  ruleId?: string;
}): FindingGuidanceFields {
  const analyzer = input.ruleId ? ANALYZER_GUIDANCE[input.ruleId] : undefined;
  const entry = playbookForCategory(input.category);
  return {
    guidance: analyzer?.guidance ?? entry?.guidance ?? GENERIC_GUIDANCE,
    reviewQuestions: analyzer?.reviewQuestions ?? entry?.reviewQuestions ?? GENERIC_QUESTIONS,
    impactExplanation: impactExplanationFor(input.impact),
  };
}

export function assertGuidanceHasNoEmptyPlaybook(): void {
  for (const category of RISK_CATEGORIES) {
    const entry = PLAYBOOK[category];
    if (!entry.guidance.trim()) {
      throw new Error(`Playbook ${category} is missing guidance`);
    }
    if (entry.reviewQuestions.length === 0) {
      throw new Error(`Playbook ${category} is missing review questions`);
    }
  }
}
