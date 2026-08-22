import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';

const app = await buildApp();

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('returns ok with service metadata', async () => {
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
  });
});
