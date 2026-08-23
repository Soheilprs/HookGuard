import type {
  HookContractResponse,
  HookDetailResponse,
  HookFindingsResponse,
  HookListResponse,
  RegistryStats,
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
