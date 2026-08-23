import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getChainBySlug } from '@hookguard/blockchain';
import type { WatchlistService } from './service.js';

interface AddressParams {
  address: string;
}

interface WatchQuery {
  chainId?: string;
  chain?: string;
  identifier?: string;
}

interface WatchBody {
  identifier?: string;
  eventTypes?: string[];
  chainId?: number;
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

function parseChainId(query: WatchQuery, body?: WatchBody): number | undefined {
  const raw = body?.chainId ?? (query.chainId ? Number(query.chainId) : undefined);
  if (raw !== undefined && !Number.isInteger(raw)) {
    const error = new Error('chainId must be an integer');
    (error as Error & { statusCode: number }).statusCode = 400;
    throw error;
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
  return raw;
}

export async function watchlistController(
  app: FastifyInstance,
  options: { service: WatchlistService },
): Promise<void> {
  const { service } = options;

  app.post(
    '/hooks/:address/watch',
    async (
      request: FastifyRequest<{
        Params: AddressParams;
        Querystring: WatchQuery;
        Body: WatchBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const body = request.body ?? {};
        const chainId = parseChainId(request.query, body);
        return await service.watch(
          request.params.address,
          body.identifier ?? request.query.identifier ?? 'anonymous',
          chainId,
          body.eventTypes,
        );
      } catch (error) {
        const status = statusCodeOf(error);
        return reply.status(status).send({
          error: error instanceof Error ? error.message : 'Failed to watch hook',
        });
      }
    },
  );

  app.delete(
    '/hooks/:address/watch',
    async (
      request: FastifyRequest<{ Params: AddressParams; Querystring: WatchQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const chainId = parseChainId(request.query);
        return await service.unwatch(
          request.params.address,
          request.query.identifier ?? 'anonymous',
          chainId,
        );
      } catch (error) {
        const status = statusCodeOf(error);
        return reply.status(status).send({
          error: error instanceof Error ? error.message : 'Failed to unwatch hook',
        });
      }
    },
  );

  app.get(
    '/hooks/:address/watch',
    async (
      request: FastifyRequest<{ Params: AddressParams; Querystring: WatchQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const chainId = parseChainId(request.query);
        return await service.status(
          request.params.address,
          request.query.identifier ?? 'anonymous',
          chainId,
        );
      } catch (error) {
        const status = statusCodeOf(error);
        return reply.status(status).send({
          error: error instanceof Error ? error.message : 'Failed to load watch status',
        });
      }
    },
  );

  app.get(
    '/watchlist',
    async (request: FastifyRequest<{ Querystring: { identifier?: string } }>) => {
      return service.list(request.query.identifier ?? 'anonymous');
    },
  );
}
