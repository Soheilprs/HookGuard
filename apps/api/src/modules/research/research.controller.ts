import type { FastifyInstance, FastifyReply } from 'fastify';
import { generateLandscapeReport } from './research.service.js';
import { generateInteractionReport } from './interaction-research.service.js';

export async function researchController(app: FastifyInstance): Promise<void> {
  app.get('/research/landscape', async (_request, reply: FastifyReply) => {
    try {
      return await generateLandscapeReport();
    } catch (error) {
      return reply.status(503).send({
        error: error instanceof Error ? error.message : 'Landscape report unavailable',
      });
    }
  });

  app.get('/research/interactions', async (_request, reply: FastifyReply) => {
    try {
      return await generateInteractionReport();
    } catch (error) {
      return reply.status(503).send({
        error: error instanceof Error ? error.message : 'Interaction report unavailable',
      });
    }
  });
}
