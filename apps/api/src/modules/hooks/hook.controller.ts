import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getChainBySlug } from '@hookguard/blockchain';
import type { HookService } from './hook.service.js';

interface ListQuery {
  chainId?: string;
  chain?: string;
  limit?: string;
}

interface AddressParams {
  address: string;
}

interface AddressQuery {
  chainId?: string;
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

function parseChainId(query: ListQuery | AddressQuery): number | undefined {
  if (query.chainId) {
    const value = Number(query.chainId);
    if (!Number.isInteger(value)) {
      const error = new Error('chainId must be an integer');
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }
    return value;
  }
  if ('chain' in query && query.chain) {
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

export async function hookController(
  app: FastifyInstance,
  options: { service: HookService },
): Promise<void> {
  const { service } = options;

  app.get(
    '/hooks',
    async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
      try {
        const chainId = parseChainId(request.query);
        const limit = request.query.limit ? Number(request.query.limit) : undefined;
        return await service.listHooks(chainId, limit);
      } catch (error) {
        const status = statusCodeOf(error);
        return reply.status(status).send({
          error: error instanceof Error ? error.message : 'Failed to list hooks',
        });
      }
    },
  );

  app.get(
    '/hooks/:address',
    async (
      request: FastifyRequest<{ Params: AddressParams; Querystring: AddressQuery }>,
      reply: FastifyReply,
    ) => {
      try {
        const chainId = parseChainId(request.query);
        const body = await service.getByAddress(request.params.address, chainId);
        if (body.deployments.length === 0) {
          return reply.status(404).send({
            error: 'Hook not indexed',
            address: request.params.address,
            chainId: chainId ?? null,
          });
        }
        return body;
      } catch (error) {
        const status = statusCodeOf(error);
        return reply.status(status).send({
          error: error instanceof Error ? error.message : 'Failed to load hook',
        });
      }
    },
  );

  app.get('/stats', async () => service.stats());
}
