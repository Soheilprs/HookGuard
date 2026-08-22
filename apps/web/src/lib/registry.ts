/**
 * Registry reads go through the API (`src/lib/api.ts`).
 * This module no longer returns hardcoded collections.
 */
export { fetchHookSafe, fetchHooksSafe, fetchStatsSafe } from './api';
