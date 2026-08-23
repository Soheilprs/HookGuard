import type { Address } from './hook.js';
import type {
  HookMonitoringStatus,
  HookSnapshotView,
  SecurityEventItem,
} from './monitoring.js';

export interface ChainRef {
  id: number;
  slug: string;
  name: string;
}

export interface HookListItem {
  id: string;
  address: Address;
  chainId: number;
  chain: ChainRef;
  creator: Address;
  poolCount: number;
  firstSeenBlock: string;
  lastSeenBlock: string;
  lastIndexedAt: string | null;
  verifiedSource: boolean;
}

export interface PoolListItem {
  id: string;
  poolId: `0x${string}`;
  chainId: number;
  hookAddress: Address;
  token0Address: Address;
  token1Address: Address;
  token0Symbol: string | null;
  token1Symbol: string | null;
  currencyPair: string;
  fee: number;
  tickSpacing: number;
  createdAtBlock: string;
}

export interface HookDetail {
  hook: HookListItem;
  pools: PoolListItem[];
  analysisStatus: 'pending';
}

export interface HookListResponse {
  hooks: HookListItem[];
  total: number;
}

export interface HookDetailResponse {
  deployments: HookDetail[];
}

export interface RegistryStats {
  hooksIndexed: number;
  poolsTracked: number;
  findings: number;
  averageRisk: number | null;
  contractsInspected: number;
  verifiedSource: number;
  hooksMonitored: number;
  securityEvents: number;
  lastMonitoringRun: string | null;
  alertsPending: number;
  alertsSent: number;
  byChain: Array<{ chainId: number; hooks: number; pools: number }>;
}

export interface ContractFunctionItem {
  name: string;
  selector: string;
  visibility: string;
  stateMutability: string;
}

export interface ContractPermissionItem {
  type: string;
  address: Address;
  source: string;
}

export interface ContractIntelligence {
  address: Address;
  chainId: number;
  bytecodeHash: string;
  bytecodeSize: number;
  sourceVerified: boolean;
  sourceUrl: string | null;
  compilerVersion: string | null;
  isProxy: boolean;
  implementationAddress: Address | null;
  adminAddress: Address | null;
  lastCheckedAt: string | null;
  functions: ContractFunctionItem[];
  permissions: ContractPermissionItem[];
}

export interface HookContractResponse {
  deployments: Array<{
    hook: HookListItem;
    contract: ContractIntelligence | null;
    analysisStatus: 'pending';
  }>;
}

export interface FindingItem {
  ruleId: string;
  title: string;
  category: string;
  severity: string;
  confidence: string;
  detectionSource: string;
  validationStatus: string;
  ruleTier: number;
  description: string;
  evidence: Record<string, unknown>;
  createdAt: string;
}

export interface HookFindingsResponse {
  deployments: Array<{
    hook: HookListItem;
    findings: FindingItem[];
  }>;
}

export interface HookEventsResponse {
  deployments: Array<{
    hook: HookListItem;
    events: SecurityEventItem[];
  }>;
}

export interface HookMonitoringResponse {
  deployments: Array<{
    hook: HookListItem;
    monitoring: HookMonitoringStatus;
    lastSnapshot: HookSnapshotView | null;
  }>;
}
