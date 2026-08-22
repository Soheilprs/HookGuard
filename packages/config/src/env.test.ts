import { describe, expect, it } from 'vitest';
import { loadApiConfigFromEnv, loadWebConfig } from './env.js';

describe('loadApiConfigFromEnv', () => {
  it('loads defaults in test without requiring secrets', () => {
    const config = loadApiConfigFromEnv({ NODE_ENV: 'test' });
    expect(config.env).toBe('test');
    expect(config.port).toBe(3001);
    expect(config.host).toBe('0.0.0.0');
    expect(config.databaseUrl).toContain('postgresql://');
  });

  it('throws in production when DATABASE_URL is missing', () => {
    expect(() => loadApiConfigFromEnv({ NODE_ENV: 'production' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('reads explicit values from the environment', () => {
    const config = loadApiConfigFromEnv({
      NODE_ENV: 'development',
      API_HOST: '127.0.0.1',
      API_PORT: '4000',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/hookguard',
    });
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(4000);
    expect(config.databaseUrl).toContain('hookguard');
  });
});

describe('loadWebConfig', () => {
  it('uses public env defaults', () => {
    const config = loadWebConfig({});
    expect(config.apiUrl).toBe('http://localhost:3001');
    expect(config.walletConnectProjectId).toBe('');
  });
});
