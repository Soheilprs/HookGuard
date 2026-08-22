import type { FastifyInstance } from 'fastify';
import { listSupportedChains } from '@hookguard/blockchain';

const VERSION = '0.0.1';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'hookguard-api',
      version: VERSION,
      timestamp: new Date().toISOString(),
      chains: listSupportedChains().map((chain) => ({
        id: chain.id,
        slug: chain.slug,
        name: chain.name,
      })),
    };
  });
}
