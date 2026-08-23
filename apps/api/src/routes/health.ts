import type { FastifyInstance, FastifyReply } from 'fastify';
import { listSupportedChains } from '@hookguard/blockchain';
import { prisma } from '../lib/prisma.js';

const VERSION = '0.0.1';

export type DatabasePing = () => Promise<void>;

export async function defaultDatabasePing(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

function chainPayload() {
  return listSupportedChains().map((chain) => ({
    id: chain.id,
    slug: chain.slug,
    name: chain.name,
  }));
}

/**
 * Liveness (`/health`) does not touch the database.
 * Readiness (`/ready`) pings PostgreSQL so a load balancer can stop traffic.
 */
export async function healthRoutes(
  app: FastifyInstance,
  options: { ping?: DatabasePing } = {},
): Promise<void> {
  const ping = options.ping ?? defaultDatabasePing;

  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'hookguard-api',
      version: VERSION,
      timestamp: new Date().toISOString(),
      chains: chainPayload(),
    };
  });

  app.get('/ready', async (_request, reply: FastifyReply) => {
    try {
      await ping();
      return {
        status: 'ready',
        service: 'hookguard-api',
        version: VERSION,
        timestamp: new Date().toISOString(),
        database: 'up',
        chains: chainPayload(),
      };
    } catch {
      return reply.status(503).send({
        status: 'not_ready',
        service: 'hookguard-api',
        version: VERSION,
        timestamp: new Date().toISOString(),
        database: 'down',
        error: 'Database ping failed',
      });
    }
  });
}
