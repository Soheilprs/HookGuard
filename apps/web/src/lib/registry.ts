import type { Finding, Hook, HookSummary, Pool } from '@hookguard/types';

/**
 * Phase 0 data access. Returns empty results until indexing ships.
 * Do not invent security findings or indexed hooks.
 */

export function listHooks(): HookSummary[] {
  return [];
}

export function getHook(_address: string): Hook | null {
  return null;
}

export function listPoolsForHook(_hookId: string): Pool[] {
  return [];
}

export function listFindingsForHook(_hookId: string): Finding[] {
  return [];
}

export function dashboardStats() {
  const hooks = listHooks();
  return {
    hooksIndexed: hooks.length,
    poolsTracked: 0,
    findings: 0,
    averageRisk: null as number | null,
  };
}
