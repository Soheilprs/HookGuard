import type { Address } from './hook.js';
import type { HookListItem } from './api.js';
import type { FindingItem } from './api.js';
import type {
  HookMonitoringStatus,
  HookSnapshotView,
  SecurityEventItem,
} from './monitoring.js';
import type { ContractIntelligence, PoolListItem } from './api.js';

export const DEFAULT_ALERT_EVENT_TYPES = [
  'IMPLEMENTATION_CHANGED',
  'PROXY_ADMIN_CHANGED',
  'OWNERSHIP_CHANGED',
  'BYTECODE_CHANGED',
  'PRIVILEGED_FUNCTION_ADDED',
] as const;

export type AlertDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface AlertPreferenceItem {
  eventType: string;
  enabled: boolean;
}

export interface WatchlistItem {
  id: string;
  identifier: string;
  createdAt: string;
  lastNotifiedAt: string | null;
  hook: HookListItem;
  preferences: AlertPreferenceItem[];
}

export interface WatchlistResponse {
  watchlists: WatchlistItem[];
}

export interface WatchMutationResponse {
  watched: boolean;
  watchlist: WatchlistItem | null;
}

export interface AlertDeliveryItem {
  id: string;
  status: AlertDeliveryStatus | string;
  sentAt: string | null;
  error: string | null;
  attempts: number;
  event: SecurityEventItem;
  hookAddress: Address;
  chainId: number;
}

export interface HookAlertsResponse {
  deployments: Array<{
    hook: HookListItem;
    alerts: AlertDeliveryItem[];
  }>;
}

export interface RecentEventsResponse {
  events: Array<SecurityEventItem & { hook: HookListItem }>;
}

export interface RecentAlertsResponse {
  alerts: AlertDeliveryItem[];
}

export interface PublicHookDeployment {
  hook: HookListItem;
  pools: PoolListItem[];
  contract: ContractIntelligence | null;
  findings: FindingItem[];
  events: SecurityEventItem[];
  monitoring: HookMonitoringStatus;
  lastSnapshot: HookSnapshotView | null;
  watched: boolean;
}

export interface PublicHookResponse {
  deployments: PublicHookDeployment[];
}
