import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getChainBySlug } from '@hookguard/blockchain';
import type { PublicHookService } from './public.service.js';

interface AddressParams {
  address: string;
}

interface PublicQuery {
  chainId?: string;
  chain?: string;
  identifier?: string;
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

function parseChainId(query: PublicQuery): number | undefined {
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

export async function publicController(
  app: FastifyInstance,
  options: { service: PublicHookService },
): Promise<void> {
  const { service } = options;

  app.get(
    '/public/hooks/:address',
    async (
      request: FastifyRequest<{ Params: AddressParams; Querystring: PublicQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        return await service.getPublicHook(
          request.params.address,
          parseChainId(request.query),
          request.query.identifier,
        );
      } catch (error) {
        const status = statusCodeOf(error);
        return reply.status(status).send({
          error: error instanceof Error ? error.message : 'Failed to load public hook',
        });
      }
    },
  );

  app.get(
    '/events/recent',
    async (request: FastifyRequest<{ Querystring: { limit?: string } }>) => {
      const limit = request.query.limit ? Number(request.query.limit) : 20;
      return service.recentEvents(Number.isInteger(limit) ? limit : 20);
    },
  );
}
