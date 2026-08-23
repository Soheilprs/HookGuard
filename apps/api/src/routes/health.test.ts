import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';

const app = await buildApp({
  databasePing: async () => undefined,
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('returns ok with service metadata without a database ping', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);

    const body = response.json() as {
      status: string;
      service: string;
      version: string;
      timestamp: string;
      chains: { id: number; slug: string }[];
    };

    expect(body.status).toBe('ok');
    expect(body.service).toBe('hookguard-api');
    expect(body.version).toBe('0.0.1');
    expect(typeof body.timestamp).toBe('string');
    expect(body.chains.map((c) => c.slug).sort()).toEqual(['ethereum', 'unichain']);
    expect(JSON.stringify(body)).not.toMatch(/DATABASE_URL/);
  });
});

describe('GET /ready', () => {
  it('returns ready when the database ping succeeds', async () => {
    const response = await app.inject({ method: 'GET', url: '/ready' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { status: string; database: string };
    expect(body.status).toBe('ready');
    expect(body.database).toBe('up');
  });

  it('returns 503 when the database ping fails', async () => {
    const down = await buildApp({
      databasePing: async () => {
        throw new Error('connection refused');
      },
    });
    try {
      const response = await down.inject({ method: 'GET', url: '/ready' });
      expect(response.statusCode).toBe(503);
      const body = response.json() as { status: string; database: string };
      expect(body.status).toBe('not_ready');
      expect(body.database).toBe('down');
    } finally {
      await down.close();
    }
  });
});

describe('error handling', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const response = await app.inject({ method: 'GET', url: '/no-such-route' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'Not found' });
  });
});
