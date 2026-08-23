import type { InteractionReport, LandscapeReport } from '@hookguard/blockchain';
import type {
  HookContractResponse,
  HookDetailResponse,
  HookEventsResponse,
  HookFindingsResponse,
  HookListResponse,
  HookMonitoringResponse,
  PublicHookResponse,
  RecentAlertsResponse,
  RecentEventsResponse,
  RegistryStats,
  WatchlistResponse,
} from '@hookguard/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    const error = new Error(body.error ?? `API ${response.status}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}

export async function fetchHooks(chainId?: number): Promise<HookListResponse> {
  const params = new URLSearchParams();
  if (chainId !== undefined) params.set('chainId', String(chainId));
  const query = params.toString();
  return getJson<HookListResponse>(`/hooks${query ? `?${query}` : ''}`);
}

export async function fetchHook(
  address: string,
  chainId?: number,
): Promise<HookDetailResponse> {
  const params = new URLSearchParams();
  if (chainId !== undefined) params.set('chainId', String(chainId));
  const query = params.toString();
  return getJson<HookDetailResponse>(
    `/hooks/${encodeURIComponent(address)}${query ? `?${query}` : ''}`,
  );
}

export async function fetchStats(): Promise<RegistryStats> {
  return getJson<RegistryStats>('/stats');
}

export async function fetchInteractionsSafe(): Promise<InteractionReport | null> {
  try {
    const response = await fetch(`${API_URL}/research/interactions`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as InteractionReport;
  } catch {
    return null;
  }
}

export async function fetchLandscapeSafe(): Promise<LandscapeReport | null> {
  try {
    const response = await fetch(`${API_URL}/research/landscape`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as LandscapeReport;
  } catch {
    return null;
  }
}

export async function fetchCorpusSafe(): Promise<RegistryStats> {
  try {
    return await getJson<RegistryStats>('/corpus');
  } catch {
    return fetchStatsSafe();
  }
}

export async function fetchHooksSafe(chainId?: number): Promise<HookListResponse> {
  try {
    return await fetchHooks(chainId);
  } catch {
    return { hooks: [], total: 0 };
  }
}

export async function fetchStatsSafe(): Promise<RegistryStats> {
  try {
    return await fetchStats();
  } catch {
    return {
      hooksIndexed: 0,
      poolsTracked: 0,
      findings: 0,
      averageRisk: null,
      contractsInspected: 0,
      verifiedSource: 0,
      hooksMonitored: 0,
      securityEvents: 0,
      lastMonitoringRun: null,
      alertsPending: 0,
      alertsSent: 0,
      byChain: [],
    };
  }
}

export async function fetchHookContract(
  address: string,
  chainId?: number,
): Promise<HookContractResponse> {
  const params = new URLSearchParams();
  if (chainId !== undefined) params.set('chainId', String(chainId));
  const query = params.toString();
  return getJson<HookContractResponse>(
    `/hooks/${encodeURIComponent(address)}/contract${query ? `?${query}` : ''}`,
  );
}

export async function fetchHookContractSafe(
  address: string,
  chainId?: number,
): Promise<HookContractResponse | null> {
  try {
    return await fetchHookContract(address, chainId);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 404
    ) {
      return { deployments: [] };
    }
    return null;
  }
}

export async function fetchHookFindings(
  address: string,
  chainId?: number,
): Promise<HookFindingsResponse> {
  const params = new URLSearchParams();
  if (chainId !== undefined) params.set('chainId', String(chainId));
  const query = params.toString();
  return getJson<HookFindingsResponse>(
    `/hooks/${encodeURIComponent(address)}/findings${query ? `?${query}` : ''}`,
  );
}

export async function fetchHookFindingsSafe(
  address: string,
  chainId?: number,
): Promise<HookFindingsResponse | null> {
  try {
    return await fetchHookFindings(address, chainId);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 404
    ) {
      return { deployments: [] };
    }
    return null;
  }
}

export async function fetchHookEvents(
  address: string,
  chainId?: number,
): Promise<HookEventsResponse> {
  const params = new URLSearchParams();
  if (chainId !== undefined) params.set('chainId', String(chainId));
  const query = params.toString();
  return getJson<HookEventsResponse>(
    `/hooks/${encodeURIComponent(address)}/events${query ? `?${query}` : ''}`,
  );
}

export async function fetchHookEventsSafe(
  address: string,
  chainId?: number,
): Promise<HookEventsResponse | null> {
  try {
    return await fetchHookEvents(address, chainId);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 404
    ) {
      return { deployments: [] };
    }
    return null;
  }
}

export async function fetchHookMonitoring(
  address: string,
  chainId?: number,
): Promise<HookMonitoringResponse> {
  const params = new URLSearchParams();
  if (chainId !== undefined) params.set('chainId', String(chainId));
  const query = params.toString();
  return getJson<HookMonitoringResponse>(
    `/hooks/${encodeURIComponent(address)}/monitoring${query ? `?${query}` : ''}`,
  );
}

export async function fetchHookMonitoringSafe(
  address: string,
  chainId?: number,
): Promise<HookMonitoringResponse | null> {
  try {
    return await fetchHookMonitoring(address, chainId);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 404
    ) {
      return { deployments: [] };
    }
    return null;
  }
}

export async function fetchPublicHook(
  address: string,
  chainId?: number,
): Promise<PublicHookResponse> {
  const params = new URLSearchParams();
  if (chainId !== undefined) params.set('chainId', String(chainId));
  const query = params.toString();
  return getJson<PublicHookResponse>(
    `/public/hooks/${encodeURIComponent(address)}${query ? `?${query}` : ''}`,
  );
}

export async function fetchPublicHookSafe(
  address: string,
  chainId?: number,
): Promise<PublicHookResponse | null> {
  try {
    return await fetchPublicHook(address, chainId);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 404
    ) {
      return { deployments: [] };
    }
    return null;
  }
}

export async function fetchRecentEventsSafe(): Promise<RecentEventsResponse> {
  try {
    return await getJson<RecentEventsResponse>('/events/recent?limit=8');
  } catch {
    return { events: [] };
  }
}

export async function fetchRecentAlertsSafe(): Promise<RecentAlertsResponse> {
  try {
    return await getJson<RecentAlertsResponse>('/alerts/recent?limit=8');
  } catch {
    return { alerts: [] };
  }
}

export async function fetchWatchlistSafe(identifier: string): Promise<WatchlistResponse> {
  try {
    const params = new URLSearchParams({ identifier });
    return await getJson<WatchlistResponse>(`/watchlist?${params}`);
  } catch {
    return { watchlists: [] };
  }
}

export async function fetchHookSafe(
  address: string,
  chainId?: number,
): Promise<HookDetailResponse | null> {
  try {
    return await fetchHook(address, chainId);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 404
    ) {
      return { deployments: [] };
    }
    return null;
  }
}
