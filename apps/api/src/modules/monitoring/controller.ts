import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getChainBySlug } from '@hookguard/blockchain';
import type { MonitoringService } from './service.js';

interface AddressParams {
  address: string;
}

interface AddressQuery {
  chainId?: string;
  chain?: string;
}

function statusCodeOf(error: unknown): number {
  if (
    error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }
  return 500;
}

function parseChainId(query: AddressQuery): number | undefined {
  if (query.chainId) {
    const value = Number(query.chainId);
    if (!Number.isInteger(value)) {
      const error = new Error('chainId must be an integer');
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }
    return value;
  }
  if (query.chain) {
    const chain = getChainBySlug(query.chain);
    if (!chain) {
      const error = new Error(`Unknown chain: ${query.chain}`);
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }
    return chain.id;
  }
  return undefined;
}

export async function monitoringController(
  app: FastifyInstance,
  options: { service: MonitoringService },
): Promise<void> {
  const { service } = options;

  app.get(
    '/hooks/:address/events',
    async (
      request: FastifyRequest<{ Params: AddressParams; Querystring: AddressQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const chainId = parseChainId(request.query);
        return await service.getEvents(request.params.address, chainId);
      } catch (error) {
        const status = statusCodeOf(error);
        return reply.status(status).send({
          error: error instanceof Error ? error.message : 'Failed to load events',
        });
      }
    },
  );

  app.get(
    '/hooks/:address/monitoring',
    async (
      request: FastifyRequest<{ Params: AddressParams; Querystring: AddressQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const chainId = parseChainId(request.query);
        return await service.getMonitoring(request.params.address, chainId);
      } catch (error) {
        const status = statusCodeOf(error);
        return reply.status(status).send({
          error: error instanceof Error ? error.message : 'Failed to load monitoring',
        });
      }
    },
  );
}
