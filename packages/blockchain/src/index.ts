export {
  CHAINS,
  SUPPORTED_CHAIN_IDS,
  explorerAddressUrl,
  getChainById,
  getChainBySlug,
  isSupportedChainId,
  listSupportedChains,
  type SupportedChainId,
} from './chains.js';

export type { HookIndexer, HookIndexerFactory } from './interfaces/hook-indexer.js';
export type {
  AnalyzeRequest,
  AnalyzeResult,
  ContractAnalyzer,
} from './interfaces/contract-analyzer.js';
export type { RiskEngine, ScoreRequest } from './interfaces/risk-engine.js';

export {
  DYNAMIC_FEE_FLAG,
  formatSwapFee,
  INITIALIZE_EVENT,
  INITIALIZE_EVENT_NAME,
  INITIALIZE_TOPIC,
  decodeInitializeLog,
  decodeInitializeLogs,
  isInitializeTopic,
  isZeroAddress,
  normalizeAddress,
  computePoolId,
  nextBlockRange,
  resumeBlock,
  splitRange,
  isRangeTooLargeError,
  withRpcRetry,
  PoolManagerLogFetcher,
  createReadOnlyClient,
  rpcUrlForSupportedChain,
  ViemTokenMetadataProvider,
  StaticTokenMetadataProvider,
  currencyPairLabel,
} from './uniswap-v4/index.js';

export type {
  DecodedInitialize,
  PoolKey,
  BlockRange,
  InitializeLogFetcher,
  InitializeRpcLog,
  ReadOnlyClient,
  TokenMetadataProvider,
} from './uniswap-v4/index.js';

export {
  fetchBytecode,
  inspectBytecode,
  normalizeBytecode,
  byteLength,
  extractSelectors,
  bytecodeContainsSelector,
  parseAbiJson,
  functionsFromAbi,
  functionsFromBytecode,
  mergeFunctions,
  EIP1967_IMPLEMENTATION_SLOT,
  EIP1967_ADMIN_SLOT,
  detectProxy,
  addressFromStorage,
  EMPTY_SOURCE,
  StaticSourceProvider,
  SourcifySourceProvider,
  EtherscanSourceProvider,
  CompositeSourceProvider,
  createDefaultSourceProvider,
  explorerApiUrl,
  DEFAULT_ADMIN_ROLE,
  detectPermissions,
  collectContractIntelligence,
} from './contract/index.js';

export type {
  BytecodeSnapshot,
  ParsedFunction,
  ProxyFacts,
  ProxyKind,
  VerifiedSource,
  SourceProvider,
  PermissionFact,
  ContractIntelligenceFacts,
} from './contract/index.js';

export {
  runAnalysis,
  DEFAULT_RULES,
  engineRuleIds,
  scanOpcodes,
  hookAddressFlags,
  classifyHookPermissions,
  HOOK_CALLBACKS,
  PRIVILEGED_FUNCTIONS,
  RULE_TIERS,
  ruleTier,
  parseValidationDataset,
  computeValidationMetrics,
  precision,
  associateCallsWithSource,
  privilegedMutators,
  riskRules,
  collectCapabilityFacts,
  RISK_CATEGORIES,
  RISK_CATEGORY_LABELS,
  isRiskCategory,
  CAPABILITY_DISCLAIMER,
  RISK_IMPACTS,
  IMPACT_LABELS,
  impactSeverity,
} from './analysis/index.js';

export {
  buildMonitorSnapshot,
  compareSnapshots,
  changeFingerprint,
  detectBytecodeChanges,
  detectOwnershipChanges,
  detectPermissionChanges,
  detectProxyChanges,
  hashFunctions,
  hashPermissions,
  normalizeMonitorAddress,
  ownerFromPermissions,
  privilegedEntries,
  SECURITY_EVENT_TYPES,
} from './monitoring/index.js';

export type {
  MonitorSnapshot,
  SecurityChange,
  SnapshotFunction,
  SnapshotPermission,
} from './monitoring/index.js';

export type {
  AnalysisInput,
  AnalysisFunction,
  AnalysisPermission,
  AnalysisProxy,
  AnalysisRule,
  EngineFinding,
  CapabilityFacts,
  AffectedComponent,
  ValidationDataset,
  ValidationReview,
  ValidationMetrics,
  RuleQualityRow,
} from './analysis/index.js';

export {
  GUIDANCE_DISCLAIMER,
  PLAYBOOK,
  assertGuidanceHasNoEmptyPlaybook,
  findingGuidanceFor,
  impactExplanationFor,
  playbookForCategory,
} from './guidance/index.js';

export type { FindingGuidanceFields, PlaybookCategory } from './guidance/index.js';

export { analyzerRules, ANALYZER_RULE_IDS, parseSolidityFunctions } from './analyzer/index.js';

export {
  buildLandscapeReport,
  computeLandscapeMetrics,
  exportLandscapeJson,
  exportLandscapeMarkdown,
  assertReportEvidence,
  LANDSCAPE_DISCLAIMER,
  ANALYSIS_RESEARCH_DETECTORS,
  ANALYSIS_RESEARCH_DISCLAIMER,
  assertAnalysisResearchEvidence,
  buildAnalysisResearchReport,
  exportAnalysisResearchJson,
  exportAnalysisResearchMarkdown,
  evidenceFileName,
  exportEvidenceMarkdown,
} from './reporting/index.js';

export type {
  LandscapeReport,
  LandscapeMetrics,
  ReportCorpus,
  ReportHook,
  ReportFinding,
  AnalysisResearchCorpus,
  AnalysisResearchFindingInput,
  AnalysisResearchReport,
} from './reporting/index.js';
