export type AppEnv = 'development' | 'test' | 'production';

export interface ApiConfig {
  env: AppEnv;
  host: string;
  port: number;
  databaseUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  /** `true` reflects the request origin. Otherwise an allow-list. */
  corsOrigin: true | string[];
}

export interface WebConfig {
  env: AppEnv;
  apiUrl: string;
  walletConnectProjectId: string;
}

function parseEnv(value: string | undefined): AppEnv {
  if (value === 'production' || value === 'test' || value === 'development') {
    return value;
  }
  return 'development';
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

/**
 * Load API process configuration from the environment.
 * Secrets are never hardcoded. Test env may use a local default URL.
 */
export function loadApiConfigFromEnv(
  source: NodeJS.ProcessEnv = process.env,
): ApiConfig {
  const env = parseEnv(source.NODE_ENV);
  const databaseUrl =
    source.DATABASE_URL ??
    (env === 'test'
      ? 'postgresql://postgres:postgres@localhost:5432/hookguard_test'
      : undefined);

  if (!databaseUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  return {
    env,
    host: source.API_HOST ?? '0.0.0.0',
    port: parsePort(source.API_PORT ?? '3001'),
    databaseUrl,
    telegramBotToken: source.TELEGRAM_BOT_TOKEN ?? '',
    telegramChatId: source.TELEGRAM_CHAT_ID ?? '',
    corsOrigin: parseCorsOrigin(source.CORS_ORIGIN ?? source.CORS_ORIGINS, env),
  };
}

/**
 * Development reflects any origin. Production should set CORS_ORIGIN to the
 * public web origin(s), comma-separated. `*` is allowed only outside production.
 */
export function parseCorsOrigin(
  raw: string | undefined,
  env: AppEnv,
): true | string[] {
  const value = raw?.trim();
  if (!value) {
    return env === 'production' ? [] : true;
  }
  if (value === '*') {
    if (env === 'production') {
      throw new Error('CORS_ORIGIN=* is not allowed when NODE_ENV=production');
    }
    return true;
  }
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function loadWebConfig(source: NodeJS.ProcessEnv = process.env): WebConfig {
  return {
    env: parseEnv(source.NODE_ENV),
    apiUrl: source.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    walletConnectProjectId: source.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  };
}

export function rpcUrlForChain(
  rpcEnvKey: string,
  source: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const value = source[rpcEnvKey];
  return value && value.length > 0 ? value : undefined;
}
