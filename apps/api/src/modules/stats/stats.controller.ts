import type { FastifyInstance } from 'fastify';
import { getCorpusStats, getValidationSummary } from './stats.service.js';

export async function statsController(app: FastifyInstance): Promise<void> {
  app.get('/corpus', async (_request, reply) => {
    try {
      return await getCorpusStats();
    } catch (error) {
      return reply.status(503).send({
        error: error instanceof Error ? error.message : 'Corpus unavailable',
      });
    }
  });

  app.get('/validation/summary', async () => {
    return getValidationSummary();
  });
}
