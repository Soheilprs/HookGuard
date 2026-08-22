import { loadApiConfigFromEnv, type ApiConfig } from '@hookguard/config';

let cached: ApiConfig | undefined;

export function getApiConfig(): ApiConfig {
  if (!cached) {
    cached = loadApiConfigFromEnv();
  }
  return cached;
}

export function resetApiConfigCache(): void {
  cached = undefined;
}
