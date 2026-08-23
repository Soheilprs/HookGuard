import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getChainBySlug } from '@hookguard/blockchain';
import { normalizeIdentifier } from '../watchlist/service.js';
import type { AlertService } from './alert.service.js';

interface AddressParams {
  address: string;
}

interface AlertQuery {
  chainId?: string;
  chain?: string;
  identifier?: string;
  limit?: string;
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

function parseChainId(query: AlertQuery): number | undefined {
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

export async function alertController(
  app: FastifyInstance,
  options: { service: AlertService },
): Promise<void> {
  const { service } = options;

  app.get(
    '/hooks/:address/alerts',
    async (
      request: FastifyRequest<{ Params: AddressParams; Querystring: AlertQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        return await service.listForHook(
          request.params.address,
          normalizeIdentifier(request.query.identifier),
          parseChainId(request.query),
        );
      } catch (error) {
        const status = statusCodeOf(error);
        return reply.status(status).send({
          error: error instanceof Error ? error.message : 'Failed to load alerts',
        });
      }
    },
  );

  app.get(
    '/alerts/recent',
    async (request: FastifyRequest<{ Querystring: { limit?: string } }>) => {
      const limit = request.query.limit ? Number(request.query.limit) : 20;
      return service.listRecent(Number.isInteger(limit) ? limit : 20);
    },
  );
}
